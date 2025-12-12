'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Chess } from 'chess.js'
import CustomChessboard from '@/components/CustomChessboard'

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
  const [position, setPosition] = useState(new Chess().fen())
  const [timeLeft, setTimeLeft] = useState(600) // 10 minutes in seconds
  const [gameOver, setGameOver] = useState(false)
  const [gameResult, setGameResult] = useState<'win' | 'lose' | null>(null)
  const router = useRouter()
  const supabase = createClient()

  // Generate stars once on mount
  const stars = useMemo(() => generateStars(), [])

  // Debug logging
  useEffect(() => {
    console.log('🎮 DeepBlue component mounted')
    console.log('📊 Initial state:', {
      position,
      gameOver,
      turn: game.turn(),
      isDraggable: !gameOver && game.turn() === 'w'
    })
  }, [])

  useEffect(() => {
    console.log('🔄 Position changed:', position)
  }, [position])

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

      setLoading(false)
    }

    initGame()
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

  // Simple but challenging AI - takes current game state as parameter to avoid stale state
  const makeAiMove = useCallback((currentGame: Chess) => {
    console.log('🤖 AI analyzing position:', currentGame.fen())

    if (gameOver) {
      console.log('❌ AI: Game is over')
      return
    }

    if (currentGame.turn() !== 'b') {
      console.log('❌ AI: Not black\'s turn')
      return
    }

    const possibleMoves = currentGame.moves({ verbose: true })
    console.log('🤖 AI found', possibleMoves.length, 'possible moves')

    if (possibleMoves.length === 0) return

    // Evaluate moves: prioritize captures, checks, and center control
    const evaluateMove = (move: any) => {
      let score = Math.random() * 10 // Add randomness for variety

      // Strongly prioritize captures
      if (move.captured) {
        const pieceValues: any = { p: 10, n: 30, b: 30, r: 50, q: 90 }
        score += pieceValues[move.captured] || 10
      }

      // Value center control
      const centerSquares = ['e4', 'e5', 'd4', 'd5']
      if (centerSquares.includes(move.to)) score += 15

      // Checks are valuable
      const testGame = new Chess(currentGame.fen())
      testGame.move(move)
      if (testGame.isCheck()) score += 25
      if (testGame.isCheckmate()) score += 10000 // Always take checkmate

      return score
    }

    // Sort moves by evaluation score
    const scoredMoves = possibleMoves.map(move => ({
      move,
      score: evaluateMove(move)
    })).sort((a, b) => b.score - a.score)

    // Pick randomly from top 3 moves for variety
    const topMoves = scoredMoves.slice(0, 3)
    const selectedMove = topMoves[Math.floor(Math.random() * topMoves.length)].move

    console.log('🤖 AI selected move:', selectedMove.san, `(${selectedMove.from}→${selectedMove.to})`)

    const gameCopy = new Chess(currentGame.fen())
    gameCopy.move(selectedMove)
    setGame(gameCopy)
    setPosition(gameCopy.fen())
    checkGameStatus(gameCopy)
  }, [gameOver, checkGameStatus])

  // Get possible moves for a square


  // Handle piece drop
  const onDrop = (sourceSquare: string, targetSquare: string) => {
    console.log('🎯 onDrop CALLED!', { sourceSquare, targetSquare, gameOver, turn: game.turn() })

    // Don't allow moves if game is over or not player's turn
    if (gameOver || game.turn() !== 'w') {
      console.log('❌ Move rejected - game over or not player turn')
      return false
    }

    // Try to make the move
    const gameCopy = new Chess(game.fen())
    try {
      const move = gameCopy.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q' // Always promote to queen
      })

      console.log('♟️ Move result:', move)

      // If move is illegal, chess.js returns null
      if (move === null) {
        console.log('❌ Illegal move')
        return false
      }

      // Move is legal - update state
      console.log('✅ Valid move! Updating state')
      setGame(gameCopy)
      setPosition(gameCopy.fen())

      // Check if game ended
      if (checkGameStatus(gameCopy)) {
        return true
      }

      // Queue AI move after a short delay, passing the updated game state
      console.log('🤖 Queuing AI move with updated position')
      setTimeout(() => makeAiMove(gameCopy), 300)
      return true
    } catch (error) {
      console.error('💥 Move error:', error)
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

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4 pt-32">
        {/* Title */}
        <div className="absolute top-8 left-0 right-0 text-center">
          <h1 className="text-4xl md:text-5xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            DEEP BLUE
          </h1>
          <p className="text-blue-300/60 font-mono text-sm mt-2">
            the ultimate challenge
          </p>
        </div>

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
        <div className="w-full max-w-[600px] space-y-4">
          <div className="bg-blue-950/30 border border-blue-500/30 rounded-lg p-3 text-center">
            <p className="text-blue-300 font-mono text-sm">
              <span className="text-blue-400 font-bold">Drag</span> your pieces to move them
            </p>
          </div>

          <CustomChessboard
            position={position}
            onPieceDrop={onDrop}
            isDraggable={!gameOver && game.turn() === 'w'}
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
      </div>
    </div>
  )
}
