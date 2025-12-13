'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
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
  const [aiThinking, setAiThinking] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const stockfishRef = useRef<any>(null)

  // Generate stars once on mount
  const stars = useMemo(() => generateStars(), [])

  // Initialize Stockfish engine
  useEffect(() => {
    const initStockfish = async () => {
      try {
        console.log('[STOCKFISH] Initializing engine...')

        // Use Web Worker with CDN-hosted Stockfish to bypass bundling issues
        const worker = new Worker('https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js')

        let initialized = false

        worker.onmessage = (event: MessageEvent) => {
          const message = event.data
          console.log('[STOCKFISH]', message)

          if (typeof message === 'string' && message.includes('uciok') && !initialized) {
            initialized = true
            console.log('[STOCKFISH] Engine initialized successfully')
          }
        }

        worker.onerror = (error) => {
          console.error('[STOCKFISH] Worker error:', error)
        }

        // Configure engine for maximum strength
        worker.postMessage('uci')
        worker.postMessage('setoption name Skill Level value 20') // 0-20, 20 is maximum strength
        worker.postMessage('setoption name Move Overhead value 100')
        worker.postMessage('setoption name Hash value 128') // Use 128MB hash
        worker.postMessage('setoption name Threads value 2') // Use 2 threads
        worker.postMessage('isready')

        stockfishRef.current = worker
        console.log('[STOCKFISH] Configuration sent, waiting for uciok...')
      } catch (error) {
        console.error('[STOCKFISH] Failed to initialize:', error)
      }
    }

    initStockfish()

    return () => {
      if (stockfishRef.current) {
        stockfishRef.current.terminate?.()
      }
    }
  }, [])

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

  // Stockfish AI - much stronger than heuristic
  const makeAiMove = useCallback((currentGame: Chess) => {
    if (gameOver) return
    if (currentGame.turn() !== 'b') return

    const possibleMoves = currentGame.moves({ verbose: true })
    if (possibleMoves.length === 0) return

    if (!stockfishRef.current) {
      console.warn('[AI] Stockfish not initialized! Using random fallback.')
      // Fallback: pick a random move
      const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)]
      const gameCopy = new Chess(currentGame.fen())
      gameCopy.move(randomMove)
      setGame(gameCopy)
      setPosition(gameCopy.fen())
      setAiThinking(false)
      checkGameStatus(gameCopy)
      return
    }

    console.log('[AI] Stockfish thinking... Position:', currentGame.fen())
    setAiThinking(true)

    // Set up one-time listener for bestmove
    const onMessage = (event: any) => {
      const message = event.data || event

      if (typeof message === 'string' && message.startsWith('bestmove')) {
        stockfishRef.current.onmessage = null // Remove listener

        const uciMove = message.split(' ')[1]
        console.log('[AI] Stockfish chose move:', uciMove)

        try {
          const gameCopy = new Chess(currentGame.fen())
          // Convert UCI move (e.g., "e2e4") to chess.js format
          const from = uciMove.substring(0, 2)
          const to = uciMove.substring(2, 4)
          const promotion = uciMove.length > 4 ? uciMove[4] : undefined

          const move = gameCopy.move({ from, to, promotion })

          if (move) {
            console.log('[AI] Move executed:', move.san)
            setGame(gameCopy)
            setPosition(gameCopy.fen())
            setAiThinking(false)
            checkGameStatus(gameCopy)
          } else {
            console.error('[AI] Invalid move from Stockfish:', uciMove)
            setAiThinking(false)
          }
        } catch (error) {
          console.error('[AI] Error executing move:', error)
          setAiThinking(false)
        }
      }
    }

    stockfishRef.current.onmessage = onMessage

    // Send position to Stockfish
    stockfishRef.current.postMessage('position fen ' + currentGame.fen())
    stockfishRef.current.postMessage('go movetime 2000') // Think for 2 seconds for maximum strength
  }, [gameOver, checkGameStatus])

  // Get possible moves for a square


  // Handle piece drop
  const onDrop = (sourceSquare: string, targetSquare: string) => {
    // Don't allow moves if game is over or not player's turn
    if (gameOver || game.turn() !== 'w') {
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

      // If move is illegal, chess.js returns null
      if (move === null) {
        return false
      }

      // Move is legal - update state
      setGame(gameCopy)
      setPosition(gameCopy.fen())

      // Check if game ended
      if (checkGameStatus(gameCopy)) {
        return true
      }

      // Queue AI move after a short delay, passing the updated game state
      setTimeout(() => makeAiMove(gameCopy), 300)
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
          <div className="bg-blue-950/30 border border-blue-500/30 rounded-lg p-3 text-center space-y-1">
            <p className="text-blue-300 font-mono text-sm">
              <span className="text-blue-400 font-bold">Drag</span> your pieces to move them
            </p>
            <p className="text-blue-400/60 font-mono text-xs">
              Stockfish Level 20 • 2s per move • 128MB Hash
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
                {game.turn() === 'w' ? 'YOUR TURN' : (aiThinking ? 'STOCKFISH ANALYZING...' : 'DEEP BLUE THINKING...')}
              </p>
              {game.isCheck() && (
                <p className="text-yellow-400 font-mono text-sm animate-pulse">
                  CHECK!
                </p>
              )}
              {aiThinking && (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
