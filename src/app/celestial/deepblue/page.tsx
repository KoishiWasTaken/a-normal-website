'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'

export default function DeepBluePage() {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [game, setGame] = useState(new Chess())
  const [timeLeft, setTimeLeft] = useState(600) // 10 minutes in seconds
  const [gameOver, setGameOver] = useState(false)
  const [gameResult, setGameResult] = useState<'win' | 'lose' | null>(null)
  const router = useRouter()
  const supabase = createClient()

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
    if (currentGame.isDraw() || currentGame.isStalemate() || currentGame.isThreefoldRepetition()) {
      handleLoss() // Draw counts as loss
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

  // Handle player move
  const onDrop = (sourceSquare: string, targetSquare: string, piece: string) => {
    if (gameOver) return false

    try {
      const gameCopy = new Chess(game.fen())
      const move = gameCopy.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: piece[1].toLowerCase() === 'p' ? 'q' : undefined
      })

      if (move === null) return false // Illegal move

      setGame(gameCopy)

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
    <div className="min-h-screen bg-gradient-to-b from-black via-blue-950 to-purple-950 relative overflow-hidden">
      {/* Galaxy background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute w-2 h-2 bg-white rounded-full top-[10%] left-[15%] animate-pulse" />
        <div className="absolute w-1 h-1 bg-blue-300 rounded-full top-[20%] left-[80%]" />
        <div className="absolute w-1 h-1 bg-purple-300 rounded-full top-[30%] left-[25%] animate-pulse" />
        <div className="absolute w-2 h-2 bg-white rounded-full top-[40%] left-[70%]" />
        <div className="absolute w-1 h-1 bg-blue-400 rounded-full top-[50%] left-[45%]" />
        <div className="absolute w-1 h-1 bg-white rounded-full top-[60%] left-[90%] animate-pulse" />
        <div className="absolute w-2 h-2 bg-purple-400 rounded-full top-[70%] left-[35%]" />
        <div className="absolute w-1 h-1 bg-blue-300 rounded-full top-[80%] left-[60%]" />
        <div className="absolute w-1 h-1 bg-white rounded-full top-[15%] left-[50%]" />
        <div className="absolute w-2 h-2 bg-purple-300 rounded-full top-[85%] left-[20%] animate-pulse" />
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
            boardOrientation="white"
            customBoardStyle={{
              borderRadius: '0.5rem'
            }}
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
