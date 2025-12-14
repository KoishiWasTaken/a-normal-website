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
import { AlertTriangle, Lock, Skull, Lightbulb, Grid3x3, Waypoints, Move } from 'lucide-react'

interface FlowCell {
  color: string | null
  isNode: boolean
  nodeColor?: string
  pairId?: number
}

interface FlowConnection {
  pairId: number
  path: { row: number, col: number }[]
  complete: boolean
}

interface HanoiState {
  pegs: number[][] // Each peg contains ring sizes (5 is biggest, 1 is smallest)
  selectedPeg: number | null
  moves: number
}

export default function UnnerfedPuzzlePlazaPage() {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [tracked, setTracked] = useState(false)
  const [dataRecovered, setDataRecovered] = useState(false)
  const [unnerfedMaster, setUnnerfedMaster] = useState(false)
  const [activeTab, setActiveTab] = useState('lighting')
  const [corruptedGridSize, setCorruptedGridSize] = useState(5)
  const router = useRouter()
  const supabase = createClient()

  // Lighting puzzle state
  const [lightingBoard, setLightingBoard] = useState<boolean[][]>([[]])
  const [lightingUnlocked, setLightingUnlocked] = useState(false)

  // Sliding puzzle state
  const [slidingBoard, setSlidingBoard] = useState<number[][]>([[]])
  const [emptyPos, setEmptyPos] = useState({ row: 0, col: 0 })
  const [slidingUnlocked, setSlidingUnlocked] = useState(false)

  // Flow puzzle state
  const [flowBoard, setFlowBoard] = useState<FlowCell[][]>([[]])
  const [flowConnections, setFlowConnections] = useState<Map<number, FlowConnection>>(new Map())
  const [currentDrag, setCurrentDrag] = useState<{
    pairId: number
    path: { row: number, col: number }[]
    color: string
  } | null>(null)
  const [flowUnlocked, setFlowUnlocked] = useState(false)

  // Hanoi puzzle state
  const [hanoiState, setHanoiState] = useState<HanoiState>({
    pegs: [[5, 4, 3, 2, 1], [], []],
    selectedPeg: null,
    moves: 0
  })
  const [hanoiUnlocked, setHanoiUnlocked] = useState(false)

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
        await recordPageDiscovery(supabase, user.id, 'zlepuzazapl')
        setTracked(true)
      }

      // Check if data has been recovered
      const { data: profile } = await supabase
        .from('profiles')
        .select('data_recovered, unnerfed_plaza_master')
        .eq('id', user.id)
        .single()

      if (profile) {
        setDataRecovered(profile.data_recovered || false)
        setUnnerfedMaster(profile.unnerfed_plaza_master || false)
      }

      setLoading(false)
    }

    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, supabase, tracked])

  // Initialize 10x10 lighting puzzle
  useEffect(() => {
    if (dataRecovered) {
      const board = Array(10).fill(null).map(() => Array(10).fill(false))
      setLightingBoard(board)
    }
  }, [dataRecovered])

  // Erratically change corrupted grid size
  useEffect(() => {
    if (!dataRecovered) {
      const changeSize = () => {
        // Random size between 3 and 10
        const newSize = Math.floor(Math.random() * 8) + 3
        setCorruptedGridSize(newSize)

        // Random delay between 100ms and 800ms for erratic behavior
        const delay = Math.floor(Math.random() * 700) + 100
        setTimeout(changeSize, delay)
      }

      const timeout = setTimeout(changeSize, 200)
      return () => clearTimeout(timeout)
    }
  }, [dataRecovered])

  // Initialize 10x10 sliding puzzle
  const initSlidingPuzzle = () => {
    const size = 10
    const totalTiles = 99 // Tiles 1-99, cell 100 is empty

    // Create solved board
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
    let lastMove: {row: number, col: number} | null = null

    // Make 5000 moves for thorough shuffling of 10x10 grid (size^2 * 50)
    const numMoves = size * size * 50
    for (let i = 0; i < numMoves; i++) {
      const validMoves: {row: number, col: number}[] = []
      if (emptyR > 0) validMoves.push({ row: emptyR - 1, col: emptyC })
      if (emptyR < size - 1) validMoves.push({ row: emptyR + 1, col: emptyC })
      if (emptyC > 0) validMoves.push({ row: emptyR, col: emptyC - 1 })
      if (emptyC < size - 1) validMoves.push({ row: emptyR, col: emptyC + 1 })

      // Filter out the last move to prevent immediate reversal
      const availableMoves = lastMove
        ? validMoves.filter(m => m.row !== lastMove.row || m.col !== lastMove.col)
        : validMoves

      const movesToUse = availableMoves.length > 0 ? availableMoves : validMoves
      const move = movesToUse[Math.floor(Math.random() * movesToUse.length)]

      lastMove = { row: emptyR, col: emptyC }
      board[emptyR][emptyC] = board[move.row][move.col]
      board[move.row][move.col] = 0
      emptyR = move.row
      emptyC = move.col
    }

    setSlidingBoard(board)
    setEmptyPos({ row: emptyR, col: emptyC })
  }

  // Initialize 12x15 flow puzzle
  const initFlowPuzzle = () => {
    const rows = 15
    const cols = 12

    const colors = [
      '#ef4444', // 1: red
      '#3b82f6', // 2: blue
      '#22c55e', // 3: green
      '#eab308', // 4: yellow
      '#a855f7', // 5: purple
      '#ec4899', // 6: pink
      '#f97316', // 7: orange
      '#06b6d4', // 8: cyan
      '#84cc16', // 9: lime
      '#f59e0b', // a: amber
      '#8b5cf6'  // b: violet
    ]

    const puzzleString = '6000b0000090700000068000b100000000000030000050000000080000000000030000000400057000000200000000000000000000000000100000000000000000000090000000000040000002a0000000000a00000000000000'

    const board: FlowCell[][] = Array(rows).fill(null).map(() =>
      Array(cols).fill(null).map(() => ({ color: null, isNode: false }))
    )

    for (let i = 0; i < puzzleString.length; i++) {
      const char = puzzleString[i]
      const row = Math.floor(i / cols)
      const col = i % cols

      if (char !== '0') {
        let colorId: number
        if (char === 'a') {
          colorId = 9 // amber
        } else if (char === 'b') {
          colorId = 10 // violet
        } else {
          colorId = parseInt(char) - 1
        }
        const color = colors[colorId]
        const pairId = colorId

        board[row][col] = {
          color: null,
          isNode: true,
          nodeColor: color,
          pairId
        }
      }
    }

    setFlowBoard(board)
    setFlowConnections(new Map())
    setCurrentDrag(null)
  }

  // Lighting puzzle logic
  const toggleLight = (row: number, col: number) => {
    const newBoard = lightingBoard.map(r => [...r])
    const size = newBoard.length

    newBoard[row][col] = !newBoard[row][col]
    if (row > 0) newBoard[row - 1][col] = !newBoard[row - 1][col]
    if (row < size - 1) newBoard[row + 1][col] = !newBoard[row + 1][col]
    if (col > 0) newBoard[row][col - 1] = !newBoard[row][col - 1]
    if (col < size - 1) newBoard[row][col + 1] = !newBoard[row][col + 1]

    setLightingBoard(newBoard)

    const allOn = newBoard.every(row => row.every(cell => cell))
    if (allOn) {
      setTimeout(() => {
        setLightingUnlocked(true)
      }, 500)
    }
  }

  // Sliding puzzle logic
  const slideTile = (row: number, col: number) => {
    const isAdjacent =
      (Math.abs(row - emptyPos.row) === 1 && col === emptyPos.col) ||
      (Math.abs(col - emptyPos.col) === 1 && row === emptyPos.row)

    if (!isAdjacent) return

    const newBoard = slidingBoard.map(r => [...r])
    newBoard[emptyPos.row][emptyPos.col] = newBoard[row][col]
    newBoard[row][col] = 0
    setSlidingBoard(newBoard)
    setEmptyPos({ row, col })

    const size = newBoard.length
    const isSolved = newBoard.every((row, i) =>
      row.every((cell, j) => {
        const expected = i * size + j + 1
        return expected > 99 ? cell === 0 : cell === expected
      })
    )

    if (isSolved) {
      setTimeout(() => {
        setSlidingUnlocked(true)
      }, 500)
    }
  }

  // Flow puzzle interaction
  const handleFlowMouseDown = (row: number, col: number) => {
    const cell = flowBoard[row][col]
    if (!cell.isNode || cell.pairId === undefined) return

    const color = cell.nodeColor!
    const pairId = cell.pairId

    const existingConnection = flowConnections.get(pairId)
    if (existingConnection) {
      const newBoard = flowBoard.map(r => r.map(c => ({ ...c })))
      for (const pos of existingConnection.path) {
        if (!newBoard[pos.row][pos.col].isNode) {
          newBoard[pos.row][pos.col].color = null
        }
      }
      setFlowBoard(newBoard)

      const newConnections = new Map(flowConnections)
      newConnections.delete(pairId)
      setFlowConnections(newConnections)
    }

    setCurrentDrag({
      pairId,
      path: [{ row, col }],
      color
    })
  }

  const handleFlowMouseEnter = (row: number, col: number) => {
    if (!currentDrag) return

    const cell = flowBoard[row][col]
    const lastPos = currentDrag.path[currentDrag.path.length - 1]

    const isAdjacent =
      (Math.abs(row - lastPos.row) === 1 && col === lastPos.col) ||
      (Math.abs(col - lastPos.col) === 1 && row === lastPos.row)

    if (!isAdjacent) return

    const pathIndex = currentDrag.path.findIndex(p => p.row === row && p.col === col)
    if (pathIndex !== -1 && pathIndex === currentDrag.path.length - 2) {
      const newPath = currentDrag.path.slice(0, -1)
      setCurrentDrag({ ...currentDrag, path: newPath })

      const newBoard = flowBoard.map(r => r.map(c => ({ ...c })))
      newBoard[lastPos.row][lastPos.col].color = null
      setFlowBoard(newBoard)
      return
    }

    if (cell.color && cell.color !== currentDrag.color) return

    if (cell.isNode) {
      if (cell.nodeColor !== currentDrag.color) return
      if (cell.pairId !== currentDrag.pairId) return

      const newPath = [...currentDrag.path, { row, col }]
      const newBoard = flowBoard.map(r => r.map(c => ({ ...c })))
      for (let i = 1; i < newPath.length - 1; i++) {
        newBoard[newPath[i].row][newPath[i].col].color = currentDrag.color
      }
      setFlowBoard(newBoard)

      const newConnections = new Map(flowConnections)
      newConnections.set(currentDrag.pairId, {
        pairId: currentDrag.pairId,
        path: newPath,
        complete: true
      })
      setFlowConnections(newConnections)
      setCurrentDrag(null)
      checkFlowComplete(newBoard, newConnections)
      return
    }

    if (currentDrag.path.some(p => p.row === row && p.col === col)) return

    const rows = flowBoard.length
    const cols = flowBoard[0].length
    const startNode = currentDrag.path[0]
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]]
    for (const [dr, dc] of directions) {
      const checkRow = row + dr
      const checkCol = col + dc
      if (checkRow >= 0 && checkRow < rows && checkCol >= 0 && checkCol < cols) {
        const adjacentCell = flowBoard[checkRow][checkCol]
        const isStartNode = checkRow === startNode.row && checkCol === startNode.col
        if (adjacentCell.isNode &&
            adjacentCell.pairId === currentDrag.pairId &&
            adjacentCell.nodeColor === currentDrag.color &&
            !isStartNode &&
            currentDrag.path.length >= 2) {
          const completePath = [...currentDrag.path, { row, col }, { row: checkRow, col: checkCol }]

          const newBoard = flowBoard.map(r => r.map(c => ({ ...c })))
          for (let i = 1; i < completePath.length - 1; i++) {
            newBoard[completePath[i].row][completePath[i].col].color = currentDrag.color
          }
          setFlowBoard(newBoard)

          const newConnections = new Map(flowConnections)
          newConnections.set(currentDrag.pairId, {
            pairId: currentDrag.pairId,
            path: completePath,
            complete: true
          })
          setFlowConnections(newConnections)
          setCurrentDrag(null)
          checkFlowComplete(newBoard, newConnections)
          return
        }
      }
    }

    const newPath = [...currentDrag.path, { row, col }]
    setCurrentDrag({ ...currentDrag, path: newPath })

    const newBoard = flowBoard.map(r => r.map(c => ({ ...c })))
    newBoard[row][col].color = currentDrag.color
    setFlowBoard(newBoard)
  }

  const handleFlowMouseUp = () => {
    if (currentDrag) {
      const newBoard = flowBoard.map(r => r.map(c => ({ ...c })))
      for (const pos of currentDrag.path) {
        if (!newBoard[pos.row][pos.col].isNode) {
          newBoard[pos.row][pos.col].color = null
        }
      }
      setFlowBoard(newBoard)
    }
    setCurrentDrag(null)
  }

  const handleFlowTouchStart = (e: React.TouchEvent, row: number, col: number) => {
    e.preventDefault()
    handleFlowMouseDown(row, col)
  }

  const handleFlowTouchMove = (e: React.TouchEvent) => {
    e.preventDefault()
    if (!currentDrag) return

    const touch = e.touches[0]
    const element = document.elementFromPoint(touch.clientX, touch.clientY)

    if (element && element.hasAttribute('data-flow-cell')) {
      const row = parseInt(element.getAttribute('data-flow-row') || '-1')
      const col = parseInt(element.getAttribute('data-flow-col') || '-1')

      if (row >= 0 && col >= 0) {
        handleFlowMouseEnter(row, col)
      }
    }
  }

  const handleFlowTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault()
    handleFlowMouseUp()
  }

  const checkFlowComplete = (board: FlowCell[][], connections: Map<number, FlowConnection>) => {
    const uniquePairIds = new Set<number>()
    for (let i = 0; i < board.length; i++) {
      for (let j = 0; j < board[0].length; j++) {
        if (board[i][j].isNode && board[i][j].pairId !== undefined) {
          uniquePairIds.add(board[i][j].pairId!)
        }
      }
    }
    const pairCount = uniquePairIds.size

    if (connections.size !== pairCount) return

    for (const conn of connections.values()) {
      if (!conn.complete) return
    }

    for (let i = 0; i < board.length; i++) {
      for (let j = 0; j < board[0].length; j++) {
        if (!board[i][j].isNode && !board[i][j].color) {
          return
        }
      }
    }

    setTimeout(() => {
      setFlowUnlocked(true)
    }, 500)
  }

  // Hanoi puzzle logic
  const handlePegClick = (pegIndex: number) => {
    if (hanoiState.selectedPeg === null) {
      // Select a peg to pick up from
      if (hanoiState.pegs[pegIndex].length > 0) {
        setHanoiState({
          ...hanoiState,
          selectedPeg: pegIndex
        })
      }
    } else {
      // Try to place the ring
      const fromPeg = hanoiState.selectedPeg
      const toPeg = pegIndex

      if (fromPeg === toPeg) {
        // Deselect
        setHanoiState({
          ...hanoiState,
          selectedPeg: null
        })
        return
      }

      const fromRing = hanoiState.pegs[fromPeg][hanoiState.pegs[fromPeg].length - 1]
      const toRing = hanoiState.pegs[toPeg][hanoiState.pegs[toPeg].length - 1]

      // Check if move is valid (can't place larger ring on smaller ring)
      if (toRing !== undefined && fromRing > toRing) {
        // Invalid move
        setHanoiState({
          ...hanoiState,
          selectedPeg: null
        })
        return
      }

      // Valid move
      const newPegs = hanoiState.pegs.map(peg => [...peg])
      const ring = newPegs[fromPeg].pop()!
      newPegs[toPeg].push(ring)

      const newState = {
        pegs: newPegs,
        selectedPeg: null,
        moves: hanoiState.moves + 1
      }

      setHanoiState(newState)

      // Check if solved (all rings on peg 2)
      if (newPegs[2].length === 5 && newPegs[2].every((ring, i) => ring === 5 - i)) {
        setTimeout(async () => {
          setHanoiUnlocked(true)

          // Set unnerfed_plaza_master to true
          if (user) {
            await supabase
              .from('profiles')
              .update({ unnerfed_plaza_master: true })
              .eq('user_id', user.id)

            setUnnerfedMaster(true)
          }
        }, 500)
      }
    }
  }

  const handleLightingAdvance = () => {
    setActiveTab('sliding')
    initSlidingPuzzle()
  }

  const handleSlidingAdvance = () => {
    setActiveTab('flow')
    initFlowPuzzle()
  }

  const handleFlowAdvance = () => {
    setActiveTab('torus')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-600 via-orange-500 to-pink-600 flex items-center justify-center">
        <div className="text-white font-mono text-xl animate-pulse">initializing unnerfed mode...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-600 via-orange-500 to-pink-600 animate-gradient-intense">
      <style jsx global>{`
        @keyframes gradient-intense {
          0% { background-position: 0% 50%; }
          25% { background-position: 100% 50%; }
          50% { background-position: 100% 100%; }
          75% { background-position: 0% 100%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-intense {
          background-size: 400% 400%;
          animation: gradient-intense 8s ease infinite;
        }
        @keyframes glitch {
          0%, 100% { transform: translate(0); }
          20% { transform: translate(-2px, 2px); }
          40% { transform: translate(2px, -2px); }
          60% { transform: translate(-2px, -2px); }
          80% { transform: translate(2px, 2px); }
        }
        .glitch-text {
          animation: glitch 0.3s infinite;
        }
      `}</style>

      {/* Header */}
      <header className="border-b-4 border-white/70 backdrop-blur-sm bg-black/30">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-lg md:text-xl font-mono text-white hover:text-red-200 transition-colors font-bold">
            a normal website
          </Link>
          <Link href="/archive">
            <Button variant="outline" className="font-mono border-2 border-white text-white bg-transparent hover:bg-white hover:text-red-600 font-bold">
              archive
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 md:py-16">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Title */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <Skull className="text-white animate-pulse" size={40} />
              <h1 className="text-4xl md:text-6xl font-mono font-black text-white drop-shadow-lg glitch-text">
                PUZZLE PLAZA
              </h1>
              <Skull className="text-white animate-pulse" size={40} style={{ animationDelay: '0.2s' }} />
            </div>
            <p className="text-lg md:text-xl text-white/90 font-mono font-bold glitch-text">
              [UNNERFED MODE]
            </p>
            <div className="text-sm text-white/70 font-mono">
              ⚠️ EXTREME DIFFICULTY - NO HINTS - NO MERCY ⚠️
            </div>
          </div>

          {!dataRecovered ? (
            /* CORRUPTED STATE - Data not recovered */
            <Tabs value="error" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-black/50 backdrop-blur-md border-2 border-red-500 p-1">
                <TabsTrigger value="error" className="font-mono font-bold data-[state=active]:bg-red-600 data-[state=active]:text-white text-white/70">
                  <AlertTriangle className="mr-2" size={16} />
                  ERROR
                </TabsTrigger>
                <TabsTrigger value="unavailable1" disabled className="font-mono font-bold opacity-30 text-white/50">
                  <Lock className="mr-2" size={16} />
                  ???
                </TabsTrigger>
                <TabsTrigger value="unavailable2" disabled className="font-mono font-bold opacity-30 text-white/50">
                  <Lock className="mr-2" size={16} />
                  ???
                </TabsTrigger>
                <TabsTrigger value="unavailable3" disabled className="font-mono font-bold opacity-30 text-white/50">
                  <Lock className="mr-2" size={16} />
                  ???
                </TabsTrigger>
              </TabsList>

              <TabsContent value="error" className="mt-6">
                <Card className="border-4 border-red-600 bg-black/80 backdrop-blur-lg shadow-2xl">
                  <CardHeader>
                    <CardTitle className="font-mono text-2xl text-red-500 flex items-center gap-2">
                      <AlertTriangle className="text-red-500 animate-pulse" />
                      ERROR: CORRUPTED DATA
                    </CardTitle>
                    <CardDescription className="font-mono text-red-300 font-semibold">
                      Puzzle data corrupted. Recovery in progress...
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex flex-col items-center gap-4">
                      {/* Empty Grid - Erratically changing size */}
                      <div
                        className="p-4 bg-gradient-to-br from-red-950/80 to-black/80 rounded-lg border-4 border-red-600"
                        style={{
                          width: '320px',
                          height: '320px',
                          display: 'grid',
                          gridTemplateColumns: `repeat(${corruptedGridSize}, 1fr)`,
                          gridTemplateRows: `repeat(${corruptedGridSize}, 1fr)`,
                          gap: '8px',
                        }}
                      >
                        {Array(corruptedGridSize).fill(null).map((_, i) => (
                          Array(corruptedGridSize).fill(null).map((_, j) => (
                            <div
                              key={`${i}-${j}`}
                              className="rounded-lg border-4 border-red-900/50 bg-black/50 transition-all duration-100"
                              style={{
                                width: '100%',
                                height: '100%',
                              }}
                            />
                          ))
                        ))}
                      </div>
                      <p className="text-sm font-mono text-red-400">
                        Grid Size: ?x? | Status: CORRUPTED
                      </p>
                    </div>

                    {/* Disabled Advance button */}
                    <div className="text-center pt-4 border-t border-red-800">
                      <Button
                        disabled
                        className="font-mono text-lg bg-gradient-to-r from-gray-700 to-gray-800 text-gray-500 font-bold py-6 px-8 shadow-xl opacity-50 cursor-not-allowed"
                      >
                        🔒 Advance (LOCKED)
                      </Button>
                      <p className="text-xs font-mono text-red-400 mt-2 break-all">
                        Please run the prompt "tar -xvpzf /backup/page.tsx -C /src/app/zlepuzazapl" to recover corrupted data.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            /* RECOVERED STATE - Show all puzzles */
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-black/50 backdrop-blur-md border-2 border-red-500 p-1">
                <TabsTrigger value="lighting" className="font-mono font-bold data-[state=active]:bg-red-600 data-[state=active]:text-white text-white/70">
                  <Lightbulb className="mr-2" size={16} />
                  <span className="hidden sm:inline">Lighting</span>
                </TabsTrigger>
                <TabsTrigger
                  value="sliding"
                  disabled={!lightingUnlocked && !unnerfedMaster}
                  className="font-mono font-bold data-[state=active]:bg-orange-600 data-[state=active]:text-white text-white/50 disabled:opacity-30"
                >
                  {lightingUnlocked || unnerfedMaster ? (
                    <>
                      <Grid3x3 className="mr-2" size={16} />
                      <span className="hidden sm:inline">Sliding</span>
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2" size={16} />
                      <span className="hidden sm:inline">???</span>
                    </>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="flow"
                  disabled={!slidingUnlocked && !unnerfedMaster}
                  className="font-mono font-bold data-[state=active]:bg-pink-600 data-[state=active]:text-white text-white/50 disabled:opacity-30"
                >
                  {slidingUnlocked || unnerfedMaster ? (
                    <>
                      <Waypoints className="mr-2" size={16} />
                      <span className="hidden sm:inline">Flow</span>
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2" size={16} />
                      <span className="hidden sm:inline">???</span>
                    </>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="torus"
                  disabled={!flowUnlocked && !unnerfedMaster}
                  className="font-mono font-bold data-[state=active]:bg-purple-600 data-[state=active]:text-white text-white/50 disabled:opacity-30"
                >
                  {flowUnlocked || unnerfedMaster ? (
                    <>
                      <Move className="mr-2" size={16} />
                      <span className="hidden sm:inline">Torus</span>
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2" size={16} />
                      <span className="hidden sm:inline">???</span>
                    </>
                  )}
                </TabsTrigger>
              </TabsList>

              {/* LIGHTING PUZZLE - 10x10 */}
              <TabsContent value="lighting" className="mt-6">
                <Card className="border-4 border-red-600 bg-black/80 backdrop-blur-lg shadow-2xl">
                  <CardHeader>
                    <CardTitle className="font-mono text-xl md:text-2xl text-red-400 flex items-center gap-2">
                      <Lightbulb className="text-yellow-400" />
                      Lighting Puzzle
                    </CardTitle>
                    <CardDescription className="font-mono text-red-300 font-semibold text-sm">
                      {lightingUnlocked ? '✅ Complete!' : 'Toggle all lights ON. 10×10 grid. No hints.'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex flex-col items-center gap-4">
                      <div className="inline-grid gap-1 p-4 bg-gradient-to-br from-red-950/80 to-black/80 rounded-lg border-4 border-red-600">
                        {lightingBoard.map((row, i) => (
                          <div key={i} className="flex gap-1">
                            {row.map((isOn, j) => (
                              <button
                                key={`${i}-${j}`}
                                onClick={() => toggleLight(i, j)}
                                className={`w-6 h-6 sm:w-7 sm:h-7 md:w-9 md:h-9 rounded border-2 transition-all duration-200 hover:scale-110 ${
                                  isOn
                                    ? 'bg-yellow-400 border-yellow-600 shadow-md shadow-yellow-400/50'
                                    : 'bg-gray-900 border-gray-700'
                                }`}
                              />
                            ))}
                          </div>
                        ))}
                      </div>
                      <p className="text-sm font-mono text-red-400">
                        Grid: 10×10 | Extreme Difficulty
                      </p>
                    </div>

                    <div className="text-center pt-4 border-t border-red-800">
                      <Button
                        onClick={handleLightingAdvance}
                        disabled={!lightingUnlocked}
                        className="font-mono text-base md:text-lg bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-4 md:py-6 px-6 md:px-8 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-700 disabled:to-gray-800"
                      >
                        {lightingUnlocked ? 'Advance →' : '🔒 Complete Puzzle to Unlock'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* SLIDING PUZZLE - 10x10 */}
              <TabsContent value="sliding" className="mt-6">
                <Card className="border-4 border-orange-600 bg-black/80 backdrop-blur-lg shadow-2xl">
                  <CardHeader>
                    <CardTitle className="font-mono text-xl md:text-2xl text-orange-400 flex items-center gap-2">
                      <Grid3x3 className="text-orange-400" />
                      Sliding Puzzle
                    </CardTitle>
                    <CardDescription className="font-mono text-orange-300 font-semibold text-sm">
                      {slidingUnlocked ? '✅ Complete!' : 'Arrange tiles 1-99 in order. 10×10 grid. No hints.'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex flex-col items-center gap-4">
                      <div className="inline-grid gap-1 p-4 bg-gradient-to-br from-orange-950/80 to-black/80 rounded-lg border-4 border-orange-600 overflow-auto max-w-full">
                        {slidingBoard.map((row, i) => (
                          <div key={i} className="flex gap-1">
                            {row.map((num, j) => (
                              <button
                                key={`${i}-${j}`}
                                onClick={() => slideTile(i, j)}
                                disabled={num === 0}
                                className={`w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded border-2 font-mono font-bold text-[10px] sm:text-xs transition-all duration-150 ${
                                  num === 0
                                    ? 'bg-gray-900 border-gray-800 cursor-default'
                                    : 'bg-gradient-to-br from-orange-500 to-red-600 border-orange-700 text-white hover:scale-105 cursor-pointer shadow-md'
                                }`}
                              >
                                {num !== 0 && num}
                              </button>
                            ))}
                          </div>
                        ))}
                      </div>
                      <p className="text-sm font-mono text-orange-400">
                        Grid: 10×10 (99 tiles) | Extreme Difficulty
                      </p>
                    </div>

                    <div className="text-center pt-4 border-t border-orange-800">
                      <Button
                        onClick={handleSlidingAdvance}
                        disabled={!slidingUnlocked}
                        className="font-mono text-base md:text-lg bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-4 md:py-6 px-6 md:px-8 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-700 disabled:to-gray-800"
                      >
                        {slidingUnlocked ? 'Advance →' : '🔒 Complete Puzzle to Unlock'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* FLOW PUZZLE - 12x15 */}
              <TabsContent value="flow" className="mt-6">
                <Card className="border-4 border-pink-600 bg-black/80 backdrop-blur-lg shadow-2xl">
                  <CardHeader>
                    <CardTitle className="font-mono text-xl md:text-2xl text-pink-400 flex items-center gap-2">
                      <Waypoints className="text-pink-400" />
                      Flow Puzzle
                    </CardTitle>
                    <CardDescription className="font-mono text-pink-300 font-semibold text-sm">
                      {flowUnlocked ? '✅ Complete!' : 'Connect all colors. Fill every cell. 12×15 grid. No hints.'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex flex-col items-center gap-4">
                      <div
                        className="inline-grid gap-0.5 p-3 md:p-4 bg-gradient-to-br from-pink-950/80 to-black/80 rounded-lg border-4 border-pink-600"
                        onMouseUp={handleFlowMouseUp}
                        onMouseLeave={handleFlowMouseUp}
                        onTouchEnd={handleFlowTouchEnd}
                        onTouchMove={handleFlowTouchMove}
                        style={{
                          gridTemplateColumns: `repeat(12, minmax(0, 1fr))`,
                          userSelect: 'none',
                          touchAction: 'none'
                        }}
                      >
                        {flowBoard.map((row, i) => (
                          row.map((cell, j) => (
                            <div
                              key={`${i}-${j}`}
                              data-flow-cell="true"
                              data-flow-row={i}
                              data-flow-col={j}
                              onMouseDown={() => handleFlowMouseDown(i, j)}
                              onMouseEnter={() => handleFlowMouseEnter(i, j)}
                              onTouchStart={(e) => handleFlowTouchStart(e, i, j)}
                              className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 rounded border cursor-pointer"
                              style={{
                                backgroundColor: cell.isNode ? cell.nodeColor : (cell.color || '#1a1a1a'),
                                borderColor: cell.isNode ? '#000' : '#333',
                                boxShadow: cell.isNode ? '0 2px 4px rgba(0,0,0,0.5)' : 'none'
                              }}
                            >
                              {cell.isNode && (
                                <div className="w-full h-full flex items-center justify-center">
                                  <div
                                    className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 rounded-full border-2 border-white"
                                    style={{ backgroundColor: cell.nodeColor }}
                                  />
                                </div>
                              )}
                            </div>
                          ))
                        ))}
                      </div>
                      <p className="text-sm font-mono text-pink-400">
                        Grid: 12×15 | Extreme Difficulty
                      </p>
                    </div>

                    <div className="text-center pt-4 border-t border-pink-800">
                      <Button
                        onClick={handleFlowAdvance}
                        disabled={!flowUnlocked}
                        className="font-mono text-base md:text-lg bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-4 md:py-6 px-6 md:px-8 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-700 disabled:to-gray-800"
                      >
                        {flowUnlocked ? 'Advance →' : '🔒 Complete Puzzle to Unlock'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* TOWER OF HANOI - 5 Rings */}
              <TabsContent value="torus" className="mt-6">
                <Card className="border-4 border-purple-600 bg-black/80 backdrop-blur-lg shadow-2xl">
                  <CardHeader>
                    <CardTitle className="font-mono text-xl md:text-2xl text-purple-400 flex items-center gap-2">
                      <Move className="text-purple-400" />
                      Torus Puzzle
                    </CardTitle>
                    <CardDescription className="font-mono text-purple-300 font-semibold text-sm">
                      {hanoiUnlocked ? '✅ Complete! Master Achieved!' : 'Move all rings from left to right. 5 rings. No hints.'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex flex-col items-center gap-6">
                      <div className="flex items-end gap-4 sm:gap-8 md:gap-16 p-4 md:p-8 bg-gradient-to-br from-purple-950/80 to-black/80 rounded-lg border-4 border-purple-600 overflow-x-auto max-w-full">
                        {hanoiState.pegs.map((peg, pegIndex) => (
                          <div key={pegIndex} className="flex flex-col-reverse items-center gap-1">
                            {/* Peg base */}
                            <div
                              className="w-14 sm:w-16 md:w-24 h-2 bg-purple-700 rounded cursor-pointer hover:bg-purple-600 active:bg-purple-500"
                              onClick={() => handlePegClick(pegIndex)}
                              onTouchStart={(e) => {
                                e.preventDefault()
                                handlePegClick(pegIndex)
                              }}
                            />
                            {/* Peg rod */}
                            <div
                              className="relative w-2 bg-purple-800 rounded-t cursor-pointer hover:bg-purple-700 active:bg-purple-600"
                              style={{ height: '120px', minHeight: '120px' }}
                              onClick={() => handlePegClick(pegIndex)}
                              onTouchStart={(e) => {
                                e.preventDefault()
                                handlePegClick(pegIndex)
                              }}
                            >
                              {/* Rings stacked from bottom */}
                              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 flex flex-col-reverse items-center gap-0.5">
                                {peg.map((ringSize, ringIndex) => (
                                  <div
                                    key={ringIndex}
                                    onClick={() => {
                                      if (ringIndex === peg.length - 1) {
                                        handlePegClick(pegIndex)
                                      }
                                    }}
                                    onTouchStart={(e) => {
                                      e.preventDefault()
                                      if (ringIndex === peg.length - 1) {
                                        handlePegClick(pegIndex)
                                      }
                                    }}
                                    className={`rounded-sm transition-all duration-200 ${
                                      ringIndex === peg.length - 1 ? 'cursor-pointer hover:brightness-110 active:brightness-125' : ''
                                    } ${
                                      hanoiState.selectedPeg === pegIndex && ringIndex === peg.length - 1
                                        ? 'ring-2 ring-white ring-offset-1 ring-offset-purple-900 animate-pulse'
                                        : ''
                                    }`}
                                    style={{
                                      width: `${ringSize * 8 + 20}px`,
                                      height: '14px',
                                      backgroundColor: [
                                        '#ef4444', // 5 (biggest)
                                        '#f97316', // 4
                                        '#eab308', // 3
                                        '#22c55e', // 2
                                        '#3b82f6'  // 1 (smallest)
                                      ][5 - ringSize]
                                    }}
                                  />
                                ))}
                              </div>
                            </div>
                            {/* Clickable area */}
                            <button
                              onClick={() => handlePegClick(pegIndex)}
                              onTouchStart={(e) => {
                                e.preventDefault()
                                handlePegClick(pegIndex)
                              }}
                              className={`mt-2 px-2 sm:px-3 md:px-4 py-1.5 md:py-2 rounded font-mono text-[10px] sm:text-xs transition-all ${
                                hanoiState.selectedPeg === pegIndex
                                  ? 'bg-purple-500 text-white font-bold'
                                  : 'bg-purple-900/50 text-purple-300 hover:bg-purple-800'
                              }`}
                            >
                              Peg {pegIndex + 1}
                            </button>
                          </div>
                        ))}
                      </div>
                      <p className="text-sm font-mono text-purple-400 text-center">
                        Moves: {hanoiState.moves} | Optimal: 31 | Extreme Difficulty
                      </p>
                    </div>

                    <div className="text-center pt-4 border-t border-purple-800">
                      <Button
                        disabled={!hanoiUnlocked}
                        className="font-mono text-base md:text-lg bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-4 md:py-6 px-6 md:px-8 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-700 disabled:to-gray-800"
                      >
                        {hanoiUnlocked ? 'Advance →' : '🔒 Complete Puzzle to Unlock'}
                      </Button>
                      {hanoiUnlocked && (
                        <p className="text-sm font-mono text-green-400 mt-2 font-bold">
                          ✓ UNNERFED PLAZA MASTER UNLOCKED
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}

          {/* Warning Notice */}
          <Card className="border-2 border-orange-600 bg-black/60 backdrop-blur-lg">
            <CardContent className="pt-6">
              <div className="space-y-3 text-center">
                <div className="flex items-center justify-center gap-2">
                  <Skull className="text-orange-500 animate-pulse" size={24} />
                  <p className="text-sm font-mono text-orange-400 font-bold">
                    {unnerfedMaster ? 'MASTER STATUS ACHIEVED' : 'UNNERFED MODE ACTIVE'}
                  </p>
                  <Skull className="text-orange-500 animate-pulse" size={24} />
                </div>
                {!unnerfedMaster && (
                  <>
                    <p className="text-xs md:text-sm font-mono text-orange-300/90 leading-relaxed">
                      {dataRecovered
                        ? 'Welcome to the true Puzzle Plaza. These are the original puzzles at their intended difficulty - no hand-holding, no tutorials, no second chances. Solve at your own risk.'
                        : 'Data corrupted. Please use the Terminal to run the recovery command.'}
                    </p>
                    <p className="text-xs font-mono text-red-400/70 italic">
                      "It is said that only the most determined puzzle solvers have ever seen what lies beyond..."
                    </p>
                  </>
                )}
                {unnerfedMaster && (
                  <p className="text-xs md:text-sm font-mono text-green-300/90 leading-relaxed">
                    You have conquered all four extreme challenges. You are a true Puzzle Plaza Master. All tabs and advance buttons are permanently unlocked.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
