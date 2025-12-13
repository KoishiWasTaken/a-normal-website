'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { recordPageDiscovery } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Lightbulb, Grid3x3, Lock, Zap } from 'lucide-react'

type PuzzleType = 'lighting' | 'sliding'

export default function PuzzlePlazaPage() {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [tracked, setTracked] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Lighting puzzle state
  const [lightingLevel, setLightingLevel] = useState(1)
  const [lightingBoard, setLightingBoard] = useState<boolean[][]>([[]])
  const [lightingUnlocked, setLightingUnlocked] = useState(false)

  // Sliding puzzle state
  const [slidingLevel, setSlidingLevel] = useState(1)
  const [slidingBoard, setSlidingBoard] = useState<number[][]>([[]])
  const [emptyPos, setEmptyPos] = useState({ row: 0, col: 0 })
  const [slidingUnlocked, setSlidingUnlocked] = useState(false)

  // Initialize lighting puzzle
  const initLightingPuzzle = (level: number) => {
    const size = level + 2 // 3x3 for level 1, 4x4 for level 2, 5x5 for level 3
    const board = Array(size).fill(null).map(() => Array(size).fill(false))
    setLightingBoard(board)
  }

  // Initialize sliding puzzle
  const initSlidingPuzzle = (level: number) => {
    const size = level + 2 // 3x3 for level 1, 4x4 for level 2, 5x5 for level 3
    const totalTiles = size * size - 1 // One empty space

    // Create solved board first
    const solved = Array(size).fill(null).map((_, i) =>
      Array(size).fill(null).map((_, j) => {
        const num = i * size + j + 1
        return num > totalTiles ? 0 : num
      })
    )

    // Shuffle by making random valid moves
    let board = solved.map(row => [...row])
    let emptyR = size - 1
    let emptyC = size - 1

    // Make 100 random moves to shuffle
    for (let i = 0; i < 100; i++) {
      const validMoves: {row: number, col: number}[] = []
      if (emptyR > 0) validMoves.push({ row: emptyR - 1, col: emptyC })
      if (emptyR < size - 1) validMoves.push({ row: emptyR + 1, col: emptyC })
      if (emptyC > 0) validMoves.push({ row: emptyR, col: emptyC - 1 })
      if (emptyC < size - 1) validMoves.push({ row: emptyR, col: emptyC + 1 })

      const move = validMoves[Math.floor(Math.random() * validMoves.length)]
      board[emptyR][emptyC] = board[move.row][move.col]
      board[move.row][move.col] = 0
      emptyR = move.row
      emptyC = move.col
    }

    setSlidingBoard(board)
    setEmptyPos({ row: emptyR, col: emptyC })
  }

  // Toggle light and adjacent lights
  const toggleLight = (row: number, col: number) => {
    const newBoard = lightingBoard.map(r => [...r])
    const size = newBoard.length

    // Toggle clicked cell
    newBoard[row][col] = !newBoard[row][col]

    // Toggle adjacent cells (not diagonal)
    if (row > 0) newBoard[row - 1][col] = !newBoard[row - 1][col]
    if (row < size - 1) newBoard[row + 1][col] = !newBoard[row + 1][col]
    if (col > 0) newBoard[row][col - 1] = !newBoard[row][col - 1]
    if (col < size - 1) newBoard[row][col + 1] = !newBoard[row][col + 1]

    setLightingBoard(newBoard)

    // Check if all lights are on
    const allOn = newBoard.every(row => row.every(cell => cell))
    if (allOn) {
      setTimeout(() => {
        if (lightingLevel < 3) {
          setLightingLevel(lightingLevel + 1)
          initLightingPuzzle(lightingLevel + 1)
        } else {
          // Level 3 complete - unlock advance button
          if (user) {
            savePuzzleProgress('lighting', true)
          }
          setLightingUnlocked(true)
        }
      }, 500)
    }
  }

  // Slide tile
  const slideTile = (row: number, col: number) => {
    // Check if this tile is adjacent to empty space
    const isAdjacent =
      (Math.abs(row - emptyPos.row) === 1 && col === emptyPos.col) ||
      (Math.abs(col - emptyPos.col) === 1 && row === emptyPos.row)

    if (!isAdjacent) return

    const newBoard = slidingBoard.map(r => [...r])
    newBoard[emptyPos.row][emptyPos.col] = newBoard[row][col]
    newBoard[row][col] = 0
    setSlidingBoard(newBoard)
    setEmptyPos({ row, col })

    // Check if puzzle is solved
    const size = newBoard.length
    const isSolved = newBoard.every((row, i) =>
      row.every((cell, j) => {
        const expected = i * size + j + 1
        return expected > size * size - 1 ? cell === 0 : cell === expected
      })
    )

    if (isSolved) {
      setTimeout(() => {
        if (slidingLevel < 3) {
          setSlidingLevel(slidingLevel + 1)
          initSlidingPuzzle(slidingLevel + 1)
        } else {
          // Level 3 complete - unlock advance button
          if (user) {
            savePuzzleProgress('sliding', true)
          }
          setSlidingUnlocked(true)
        }
      }, 500)
    }
  }

  // Save puzzle progress to Supabase
  const savePuzzleProgress = async (puzzleType: PuzzleType, unlocked: boolean) => {
    if (!user) return

    try {
      await supabase
        .from('puzzle_progress')
        .upsert({
          user_id: user.id,
          puzzle_type: puzzleType,
          unlocked: unlocked
        }, {
          onConflict: 'user_id,puzzle_type'
        })
    } catch (error) {
      // Silently fail
    }
  }

  // Load puzzle progress
  const loadPuzzleProgress = async () => {
    if (!user) return

    try {
      const { data } = await supabase
        .from('puzzle_progress')
        .select('puzzle_type, unlocked')
        .eq('user_id', user.id)

      if (data) {
        data.forEach(progress => {
          if (progress.puzzle_type === 'lighting' && progress.unlocked) {
            setLightingUnlocked(true)
            // Always start at level 1, don't restore level
          }
          if (progress.puzzle_type === 'sliding' && progress.unlocked) {
            setSlidingUnlocked(true)
            // Always start at level 1, don't restore level
          }
        })
      }
    } catch (error) {
      // Silently fail
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/signin')
        return
      }

      setUser(user)

      // Track page discovery
      if (!tracked) {
      await recordPageDiscovery(supabase, user.id, 'puzzleplaza')
        setTracked(true)
      }

      // Load progress (only unlock status, always start at level 1)
      await loadPuzzleProgress()

      setLoading(false)
    }

    fetchData()
  }, [router, supabase, tracked])

  useEffect(() => {
    initLightingPuzzle(lightingLevel)
  }, [lightingLevel])

  useEffect(() => {
    initSlidingPuzzle(slidingLevel)
  }, [slidingLevel])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-300 via-pink-400 to-purple-500 flex items-center justify-center">
        <div className="text-white font-mono text-xl animate-pulse">loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-300 via-pink-400 to-purple-500 animate-gradient">
      <style jsx global>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 15s ease infinite;
        }
      `}</style>

      {/* Header */}
      <header className="border-b-4 border-white/50 backdrop-blur-sm bg-white/20">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-lg md:text-xl font-mono text-white hover:text-yellow-200 transition-colors font-bold">
            a normal website
          </Link>
          <Link href="/archive">
            <Button variant="outline" className="font-mono border-2 border-white text-white bg-transparent hover:bg-white hover:text-purple-600 font-bold">
              archive
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 md:py-16">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Title */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <Zap className="text-yellow-200 animate-bounce" size={40} />
              <h1 className="text-4xl md:text-6xl font-mono font-black text-white drop-shadow-lg transform -rotate-2">
                PUZZLE PLAZA
              </h1>
              <Zap className="text-yellow-200 animate-bounce" size={40} style={{ animationDelay: '0.2s' }} />
            </div>
            <p className="text-lg md:text-xl text-white/90 font-mono font-bold transform rotate-1">
              where logic meets chaos
            </p>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="lighting" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-white/30 backdrop-blur-md border-2 border-white/50 p-1">
              <TabsTrigger value="lighting" className="font-mono font-bold data-[state=active]:bg-yellow-400 data-[state=active]:text-purple-900">
                <Lightbulb className="mr-2" size={16} />
                Lighting
              </TabsTrigger>
              <TabsTrigger value="sliding" className="font-mono font-bold data-[state=active]:bg-pink-400 data-[state=active]:text-white">
                <Grid3x3 className="mr-2" size={16} />
                Sliding
              </TabsTrigger>
              <TabsTrigger value="unavailable1" disabled className="font-mono font-bold opacity-50">
                <Lock className="mr-2" size={16} />
                Unavailable
              </TabsTrigger>
              <TabsTrigger value="unavailable2" disabled className="font-mono font-bold opacity-50">
                <Lock className="mr-2" size={16} />
                Unavailable
              </TabsTrigger>
            </TabsList>

            {/* Lighting Puzzle */}
            <TabsContent value="lighting" className="mt-6">
              <Card className="border-4 border-yellow-400 bg-white/90 backdrop-blur-lg shadow-2xl">
                <CardHeader>
                  <CardTitle className="font-mono text-2xl text-purple-900 flex items-center gap-2">
                    <Lightbulb className="text-yellow-500" />
                    Lighting Puzzle - Level {lightingLevel}
                  </CardTitle>
                  <CardDescription className="font-mono text-purple-700 font-semibold">
                    {lightingUnlocked
                      ? '✅ All levels complete! Advance button unlocked!'
                      : 'Click a square to toggle it and its adjacent squares. Light them all up!'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col items-center gap-4">
                    <div className="inline-grid gap-2 p-4 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg border-4 border-purple-400">
                      {lightingBoard.map((row, i) => (
                        <div key={i} className="flex gap-2">
                          {row.map((isOn, j) => (
                            <button
                              key={`${i}-${j}`}
                              onClick={() => toggleLight(i, j)}
                              className={`w-12 h-12 md:w-16 md:h-16 rounded-lg border-4 transition-all duration-300 transform hover:scale-110 ${
                                isOn
                                  ? 'bg-yellow-400 border-yellow-600 shadow-lg shadow-yellow-400/50'
                                  : 'bg-gray-800 border-gray-600'
                              }`}
                            />
                          ))}
                        </div>
                      ))}
                    </div>
                    <p className="text-sm font-mono text-purple-600">
                      Grid Size: {lightingBoard.length}x{lightingBoard.length} | Level {lightingLevel}/3
                    </p>
                  </div>

                  {/* Always show Advance button */}
                  <div className="text-center pt-4 border-t border-purple-300">
                    <Link href="/dark/darker/yetdarker">
                      <Button
                        disabled={!lightingUnlocked}
                        className="font-mono text-lg bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-6 px-8 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {lightingUnlocked ? 'Advance →' : '🔒 Complete Level 3 to Unlock'}
                      </Button>
                    </Link>
                    {lightingUnlocked && (
                      <p className="text-sm font-mono text-green-600 mt-2">
                        ✓ Unlocked!
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Sliding Puzzle */}
            <TabsContent value="sliding" className="mt-6">
              <Card className="border-4 border-pink-400 bg-white/90 backdrop-blur-lg shadow-2xl">
                <CardHeader>
                  <CardTitle className="font-mono text-2xl text-purple-900 flex items-center gap-2">
                    <Grid3x3 className="text-pink-500" />
                    Sliding Puzzle - Level {slidingLevel}
                  </CardTitle>
                  <CardDescription className="font-mono text-purple-700 font-semibold">
                    {slidingUnlocked
                      ? '✅ All levels complete! Advance button unlocked!'
                      : 'Slide tiles to arrange them in numerical order!'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col items-center gap-4">
                    <div className="inline-grid gap-2 p-4 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg border-4 border-pink-400">
                      {slidingBoard.map((row, i) => (
                        <div key={i} className="flex gap-2">
                          {row.map((num, j) => (
                            <button
                              key={`${i}-${j}`}
                              onClick={() => slideTile(i, j)}
                              disabled={num === 0}
                              className={`w-12 h-12 md:w-16 md:h-16 rounded-lg border-4 font-mono font-bold text-xl transition-all duration-200 ${
                                num === 0
                                  ? 'bg-gray-200 border-gray-300 cursor-default'
                                  : 'bg-gradient-to-br from-pink-400 to-purple-500 border-pink-600 text-white hover:scale-105 cursor-pointer shadow-lg'
                              }`}
                            >
                              {num !== 0 && num}
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                    <p className="text-sm font-mono text-purple-600">
                      Grid Size: {slidingBoard.length}x{slidingBoard.length} | Level {slidingLevel}/3
                    </p>
                  </div>

                  {/* Always show Advance button */}
                  <div className="text-center pt-4 border-t border-pink-300">
                    <Link href="/waterworld">
                      <Button
                        disabled={!slidingUnlocked}
                        className="font-mono text-lg bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-6 px-8 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {slidingUnlocked ? 'Advance →' : '🔒 Complete Level 3 to Unlock'}
                      </Button>
                    </Link>
                    {slidingUnlocked && (
                      <p className="text-sm font-mono text-green-600 mt-2">
                        ✓ Unlocked!
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Unavailable Tabs */}
            <TabsContent value="unavailable1">
              <Card className="border-4 border-gray-400 bg-white/90 backdrop-blur-lg">
                <CardContent className="py-12 text-center">
                  <Lock className="mx-auto mb-4 text-gray-400" size={64} />
                  <p className="text-xl font-mono text-gray-600">
                    More puzzles coming soon...
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="unavailable2">
              <Card className="border-4 border-gray-400 bg-white/90 backdrop-blur-lg">
                <CardContent className="py-12 text-center">
                  <Lock className="mx-auto mb-4 text-gray-400" size={64} />
                  <p className="text-xl font-mono text-gray-600">
                    More puzzles coming soon...
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
