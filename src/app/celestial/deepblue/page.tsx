'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Chess, Square } from 'chess.js'
import { Chessboard } from 'react-chessboard'

// Generate static stars on mount
const generateStars = () => {
  const smallStars = Array.from({ length: 50 }, (_, i) => ({
    id: `star-small-${i}`,
    size: Math.random() * 2 + 1,
    top: Math.random() * 100,
    left: Math.random() * 100,
    delay: Math.random() * 3,
    duration: Math.random() * 2 + 2
  }))

  const mediumStars = Array.from({ length: 30 }, (_, i) => ({
    id: `star-med-${i}`,
    size: Math.random() * 3 + 2,
    top: Math.random() * 100,
    left: Math.random() * 100,
    color: i % 3 === 0 ? '#93c5fd' : i % 3 === 1 ? '#c4b5fd' : '#ffffff',
    delay: Math.random() * 4,
    duration: Math.random() * 3 + 1
  }))

  return { smallStars, mediumStars }
}

export default function DeepBluePage() {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [game, setGame] = useState(new Chess())
  const [timeLeft, setTimeLeft] = useState(600) // 10 minutes in seconds
  const [gameOver, setGameOver] = useState(false)
  const [gameResult, setGameResult] = useState<'win' | 'lose' | null>(null)
  const [moveFrom, setMoveFrom] = useState<Square | null>(null)
  const [optionSquares, setOptionSquares] = useState<Record<string, any>>({})
  const router = useRouter()
  const supabase = createClient()

  // Generate stars once on mount
  const stars = useMemo(() => generateStars(), [])

  // Initialize Stockfish engine
  const [stockfish, setStockfish] = useState<Worker | null>(null)

  useEffect(() => {
    const initGame = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/signin')
        return
      }

      setUser(user)

      // Track page discovery
      await supabase.rpc('record_page_discovery', {
        p_user_id: user.id,
        p_page_key: 'deepblue'
      })

      // Initialize Stockfish from CDN
      try {
        const engine = new Worker('https://cdn.jsdelivr.net/npm/stockfish.js@10.0.2/stockfish.js')
        engine.postMessage('uci')
        engine.postMessage('setoption name Skill Level value 20') // Maximum difficulty
        engine.postMessage('isready')
        setStockfish(engine)
      } catch (error) {
        console.error('Failed to initialize Stockfish:', error)
      }

      setLoading(false)
    }

    initGame()

    return () => {
      if (stockfish) {
        stockfish.terminate()
      }
    }
  }, [router, supabase])

  // Countdown timer
  useEffect(() => {
    if (loading || gameOver) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          handleLoss()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [loading, gameOver])

  const handleLoss = useCallback(() => {
    setGameOver(true)
    setGameResult('lose')
    setTimeout(() => {
      router.push('/')
    }, 3000)
  }, [router])

  const handleWin = useCallback(async () => {
    setGameOver(true)
    setGameResult('win')

    // Set chess_champion to true
    if (user) {
      await supabase
        .from('profiles')
        .update({ chess_champion: true })
        .eq('id', user.id)
    }

    setTimeout(() => {
      router.push('/eyeofthe/hurricane')
    }, 3000)
  }, [user, supabase, router])

  // Check game status after each move
  const checkGameStatus = useCallback((currentGame: Chess) => {
    if (currentGame.isCheckmate()) {
      if (currentGame.turn() === 'b') {
        // White (player) won
        handleWin()
      } else {
        // Black (AI) won
        handleLoss()
      }
      return true
    }
    // All draw conditions count as loss
    if (currentGame.isDraw() ||
        currentGame.isStalemate() ||
        currentGame.isThreefoldRepetition() ||
        currentGame.isInsufficientMaterial()) {
      handleLoss() // Draws count as losses
      return true
    }
    return false
  }, [handleWin, handleLoss])

  // AI move using Stockfish
  const makeAiMove = useCallback(() => {
    if (!stockfish || gameOver) return

    const fen = game.fen()

    stockfish.postMessage(`position fen ${fen}`)
    stockfish.postMessage('go depth 15') // Decent depth for challenging play

    const handleMessage = (event: MessageEvent) => {
      const message = event.data
      if (typeof message === 'string' && message.startsWith('bestmove')) {
        const move = message.split(' ')[1]

        try {
          const gameCopy = new Chess(game.fen())
          gameCopy.move({
            from: move.substring(0, 2),
            to: move.substring(2, 4),
            promotion: move[4] || 'q'
          })
          setGame(gameCopy)
          checkGameStatus(gameCopy)
        } catch (error) {
          console.error('AI move error:', error)
        }

        stockfish.removeEventListener('message', handleMessage)
      }
    }

    stockfish.addEventListener('message', handleMessage)
  }, [game, stockfish, gameOver, checkGameStatus])

  // Get possible moves for a square
  const getMoveOptions = (square: Square) => {
    const moves = game.moves({
      square,
      verbose: true
    })

    if (moves.length === 0) {
      setOptionSquares({})
      return false
    }

    const newSquares: Record<string, any> = {}
    moves.forEach((move) => {
      newSquares[move.to] = {
        background: move.captured
          ? 'radial-gradient(circle, rgba(239, 68, 68, 0.4) 85%, transparent 85%)'
          : 'radial-gradient(circle, rgba(34, 197, 94, 0.4) 25%, transparent 25%)',
        borderRadius: '50%'
      }
    })
    newSquares[square] = {
      background: 'rgba(59, 130, 246, 0.4)'
    }
    setOptionSquares(newSquares)
    return true
  }

  // Handle square click
  const onSquareClick = (square: Square) => {
    if (gameOver || game.turn() !== 'w') return

    // If no piece selected, try to select this piece
    if (!moveFrom) {
      const piece = game.get(square)
      // Only select if there's a white piece on this square
      if (piece && piece.color === 'w') {
        const hasMoveOptions = getMoveOptions(square)
        if (hasMoveOptions) setMoveFrom(square)
      }
      return
    }

    // Try to make a move
    const gameCopy = new Chess(game.fen())
    const move = gameCopy.move({
      from: moveFrom,
      to: square,
      promotion: 'q'
    })

    if (move === null) {
      // Invalid move, try selecting new piece at this square
      const piece = game.get(square)
      if (piece && piece.color === 'w') {
        const hasMoveOptions = getMoveOptions(square)
        setMoveFrom(hasMoveOptions ? square : null)
      } else {
        setMoveFrom(null)
        setOptionSquares({})
      }
      return
    }

    // Valid move made
    setGame(gameCopy)
    setMoveFrom(null)
    setOptionSquares({})

    if (checkGameStatus(gameCopy)) {
      return
    }

    // AI's turn
    setTimeout(() => makeAiMove(), 500)
  }

  // Handle piece drop
  const onDrop = (sourceSquare: string, targetSquare: string) => {
    if (gameOver || game.turn() !== 'w') return false

    try {
      const gameCopy = new Chess(game.fen())
      const move = gameCopy.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q' // always promote to queen for simplicity
      })

      if (move === null) return false // Illegal move

      setGame(gameCopy)
      setMoveFrom(null)
      setOptionSquares({})

      if (checkGameStatus(gameCopy)) {
        return true
      }

      // AI's turn
      setTimeout(() => makeAiMove(), 500)
      return true
    } catch (error) {
      return false
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-blue-400 font-mono">initializing deep blue...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 opacity-60">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-purple-950 to-blue-950 animate-gradient-shift" />
      </div>

      <style jsx>{`
        @keyframes gradient-shift {
          0%, 100% {
            background: linear-gradient(135deg, #1e1b4b 0%, #581c87 50%, #172554 100%);
          }
          33% {
            background: linear-gradient(135deg, #172554 0%, #1e1b4b 50%, #4c1d95 100%);
          }
          66% {
            background: linear-gradient(135deg, #4c1d95 0%, #172554 50%, #1e1b4b 100%);
          }
        }
        .animate-gradient-shift {
          animation: gradient-shift 20s ease-in-out infinite;
        }
      `}</style>

      {/* Animated Galaxy Background */}
      <div className="absolute inset-0">
        {/* Nebula clouds */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute w-96 h-96 bg-blue-600 rounded-full blur-[100px] top-[10%] left-[20%] animate-pulse" style={{ animationDuration: '8s' }} />
          <div className="absolute w-80 h-80 bg-purple-600 rounded-full blur-[120px] top-[60%] right-[15%] animate-pulse" style={{ animationDuration: '10s' }} />
          <div className="absolute w-64 h-64 bg-indigo-600 rounded-full blur-[80px] bottom-[20%] left-[40%] animate-pulse" style={{ animationDuration: '12s' }} />
        </div>

        {/* Twinkling stars layer 1 - small stars */}
        <div className="absolute inset-0">
          {stars.smallStars.map((star) => (
            <div
              key={star.id}
              className="absolute bg-white rounded-full animate-pulse"
              style={{
                width: `${star.size}px`,
                height: `${star.size}px`,
                top: `${star.top}%`,
                left: `${star.left}%`,
                animationDelay: `${star.delay}s`,
                animationDuration: `${star.duration}s`,
                boxShadow: `0 0 ${star.size * 2}px rgba(255, 255, 255, 0.8)`
              }}
            />
          ))}
        </div>

        {/* Twinkling stars layer 2 - medium stars */}
        <div className="absolute inset-0">
          {stars.mediumStars.map((star) => (
            <div
              key={star.id}
              className="absolute rounded-full animate-pulse"
              style={{
                width: `${star.size}px`,
                height: `${star.size}px`,
                top: `${star.top}%`,
                left: `${star.left}%`,
                backgroundColor: star.color,
                animationDelay: `${star.delay}s`,
                animationDuration: `${star.duration}s`,
                boxShadow: `0 0 ${star.size * 3}px ${star.color}`
              }}
            />
          ))}
        </div>

        {/* Shooting stars */}
        <div className="absolute inset-0">
          <div className="absolute w-1 h-1 bg-white rounded-full top-[20%] left-[10%] animate-ping" style={{ animationDuration: '3s', animationDelay: '0s', boxShadow: '0 0 8px rgba(255, 255, 255, 0.8)' }} />
          <div className="absolute w-1 h-1 bg-blue-300 rounded-full top-[60%] right-[20%] animate-ping" style={{ animationDuration: '4s', animationDelay: '2s', boxShadow: '0 0 8px rgba(147, 197, 253, 0.8)' }} />
          <div className="absolute w-1 h-1 bg-purple-300 rounded-full bottom-[30%] left-[70%] animate-ping" style={{ animationDuration: '3.5s', animationDelay: '4s', boxShadow: '0 0 8px rgba(196, 181, 253, 0.8)' }} />
        </div>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">
        {/* Timer */}
        <div className="mb-8">
          <div className={`text-5xl md:text-6xl font-mono font-bold ${
            timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-blue-400'
          }`}>
            {formatTime(timeLeft)}
          </div>
          <p className="text-center text-blue-300/60 font-mono text-sm mt-2">
            time remaining
          </p>
        </div>

        {/* Chess Board */}
        <div className="w-full max-w-[600px] aspect-square shadow-2xl shadow-blue-500/20 rounded-lg overflow-hidden border-4 border-blue-500/30">
          <Chessboard
            position={game.fen()}
            onPieceDrop={onDrop}
            onSquareClick={onSquareClick}
            boardOrientation="white"
            arePiecesDraggable={!gameOver && game.turn() === 'w'}
            customBoardStyle={{
              borderRadius: '0.5rem'
            }}
            customDarkSquareStyle={{ backgroundColor: '#1e293b' }}
            customLightSquareStyle={{ backgroundColor: '#475569' }}
            customSquareStyles={optionSquares}
          />
        </div>

        {/* Status */}
        <div className="mt-8 text-center">
          {gameOver ? (
            <div className="space-y-2">
              <p className={`text-3xl font-mono font-bold ${
                gameResult === 'win' ? 'text-green-400' : 'text-red-500'
              }`}>
                {gameResult === 'win' ? 'VICTORY!' : 'DEFEAT'}
              </p>
              <p className="text-blue-300/80 font-mono text-sm">
                {gameResult === 'win'
                  ? 'redirecting to your reward...'
                  : 'returning to homepage...'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-blue-400 font-mono text-lg">
                {game.turn() === 'w' ? 'YOUR TURN' : 'DEEP BLUE THINKING...'}
              </p>
              {game.isCheck() && (
                <p className="text-yellow-400 font-mono text-sm animate-pulse">
                  CHECK!
                </p>
              )}
            </div>
          )}
        </div>

        {/* Title */}
        <div className="absolute top-8 left-0 right-0 text-center">
          <h1 className="text-4xl md:text-5xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            DEEP BLUE
          </h1>
          <p className="text-blue-300/60 font-mono text-sm mt-2">
            the ultimate challenge
          </p>
        </div>
      </div>
    </div>
  )
}
