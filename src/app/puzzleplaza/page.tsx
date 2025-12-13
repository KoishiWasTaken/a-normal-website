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
import { Lightbulb, Grid3x3, Lock, Zap, Waypoints, AlertTriangle } from 'lucide-react'
import Bluescreen from '@/components/Bluescreen'

type PuzzleType = 'lighting' | 'sliding' | 'flow'

interface FlowNode {
  row: number
  col: number
  color: string
  pairId: number
}

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

  // Flow puzzle state
  const [flowLevel, setFlowLevel] = useState(1)
  const [flowBoard, setFlowBoard] = useState<FlowCell[][]>([[]])
  const [flowNodes, setFlowNodes] = useState<FlowNode[]>([])
  const [flowUnlocked, setFlowUnlocked] = useState(false)
  const [flowConnections, setFlowConnections] = useState<Map<number, FlowConnection>>(new Map())
  const [currentDrag, setCurrentDrag] = useState<{
    pairId: number
    path: { row: number, col: number }[]
    color: string
  } | null>(null)

  // Glitch and bluescreen state
  const [isGlitching, setIsGlitching] = useState(false)
  const [showBluescreen, setShowBluescreen] = useState(false)
  const [glitchPhase, setGlitchPhase] = useState(0)

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

  // Helper: BFS pathfinding for Flow puzzle
  function findPath(
    start: {row: number, col: number},
    end: {row: number, col: number},
    occupied: Set<string>,
    size: number
  ): {row: number, col: number}[] | null {
    const queue: {row: number, col: number, path: {row: number, col: number}[]}[] = []
    const visited = new Set<string>()
    queue.push({row: start.row, col: start.col, path: [{row: start.row, col: start.col}]})
    visited.add(`${start.row},${start.col}`)

    const dirs = [[-1,0],[1,0],[0,-1],[0,1]]

    while (queue.length > 0) {
      const {row, col, path} = queue.shift()!

      if (row === end.row && col === end.col) {
        return path
      }

      for (const [dr, dc] of dirs) {
        const nr = row + dr
        const nc = col + dc

        if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
          const key = `${nr},${nc}`
          if (!visited.has(key) && (!occupied.has(key) || (nr === end.row && nc === end.col))) {
            visited.add(key)
            queue.push({row: nr, col: nc, path: [...path, {row: nr, col: nc}]})
          }
        }
      }
    }

    return null
  }

  // Initialize flow puzzle - uses preset valid puzzles
  const initFlowPuzzle = (level: number) => {
    // Define grid sizes for each level
    const size = level === 1 ? 6 : level === 2 ? 8 : 10

    // Define color palette (color ID 1-9)
    const colors = [
      '#ef4444', // 1: red
      '#3b82f6', // 2: blue
      '#22c55e', // 3: green
      '#eab308', // 4: yellow
      '#a855f7', // 5: purple
      '#ec4899', // 6: pink
      '#f97316', // 7: orange
      '#06b6d4', // 8: cyan
      '#84cc16'  // 9: lime
    ]

    // Preset valid puzzles for each level
    const presetPuzzles = {
      1: [ // 6x6 grids
        '000002000000031000000403040215000500',
        '000503000405001300000000000410000000',
        '000002000000031000200400400510500300'
      ],
      2: [ // 8x8 grids
        '5300000100000020000030000000040000200504001006000000006000000000',
        '0000000000640050003010000000000300000200000000200600004500000001',
        '0000000200000350030000000002000000400000006040100010000000050006'
      ],
      3: [ // 10x10 grids
        '0000000000000000000000000003000630000060020004805000000700000018700000000000000904020000050900000001',
        '9000000002010000000400000001000080370000037000005000000000000000000600000520000009060000000800000004',
        '0000000001300000000600900000100000000000005009040000000000060400000800000202005080000000707030000000'
      ]
    }

    // Randomly select a puzzle from the pool
    const puzzlePool = presetPuzzles[level as 1 | 2 | 3]
    const selectedPuzzle = puzzlePool[Math.floor(Math.random() * puzzlePool.length)]

    // Create board from puzzle string
    const board: FlowCell[][] = Array(size).fill(null).map(() =>
      Array(size).fill(null).map(() => ({ color: null, isNode: false }))
    )

    const nodes: FlowNode[] = []
    const colorNodeMap = new Map<number, FlowNode[]>() // Track nodes by color ID

    // Parse puzzle string and place nodes
    for (let i = 0; i < selectedPuzzle.length; i++) {
      const char = selectedPuzzle[i]
      const row = Math.floor(i / size)
      const col = i % size

      if (char !== '0') {
        // This is a node
        const colorId = parseInt(char) - 1 // Convert 1-9 to 0-8 for array index
        const pairId = colorId // Use color ID as pair ID
        const color = colors[colorId]

        // Place node on board
        board[row][col] = {
          color: null,
          isNode: true,
          nodeColor: color,
          pairId
        }

        // Add to nodes array
        const node = { row, col, color, pairId }
        nodes.push(node)

        // Track nodes by color for pair validation
        if (!colorNodeMap.has(colorId)) {
          colorNodeMap.set(colorId, [])
        }
        colorNodeMap.get(colorId)!.push(node)
      }
    }

    // Set state with clean data
    setFlowBoard(board)
    setFlowNodes(nodes)
    setFlowConnections(new Map())
    setCurrentDrag(null)
  }

  // Flow puzzle interaction - Mouse events
  const handleFlowMouseDown = (row: number, col: number) => {
    const cell = flowBoard[row][col]

    // Must start from a node
    if (!cell.isNode || cell.pairId === undefined) return

    const color = cell.nodeColor!
    const pairId = cell.pairId

    // If this node's pair is already connected, clear the connection
    const existingConnection = flowConnections.get(pairId)
    if (existingConnection) {
      // Clear the path on the board
      const newBoard = flowBoard.map(r => r.map(c => ({ ...c })))
      for (const pos of existingConnection.path) {
        if (!newBoard[pos.row][pos.col].isNode) {
          newBoard[pos.row][pos.col].color = null
        }
      }
      setFlowBoard(newBoard)

      // Remove connection
      const newConnections = new Map(flowConnections)
      newConnections.delete(pairId)
      setFlowConnections(newConnections)
    }

    // Start new drag
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

    // Check if adjacent to last position
    const isAdjacent =
      (Math.abs(row - lastPos.row) === 1 && col === lastPos.col) ||
      (Math.abs(col - lastPos.col) === 1 && row === lastPos.row)

    if (!isAdjacent) return

    // Check if going backwards (removing from path)
    const pathIndex = currentDrag.path.findIndex(p => p.row === row && p.col === col)
    if (pathIndex !== -1 && pathIndex === currentDrag.path.length - 2) {
      // Going back - remove last cell from path
      const newPath = currentDrag.path.slice(0, -1)
      setCurrentDrag({
        ...currentDrag,
        path: newPath
      })

      // Clear the cell
      const newBoard = flowBoard.map(r => r.map(c => ({ ...c })))
      newBoard[lastPos.row][lastPos.col].color = null
      setFlowBoard(newBoard)
      return
    }

    // Can't go through other colors' paths
    if (cell.color && cell.color !== currentDrag.color) return

    // Can't go through other nodes (except target node of same pair)
    if (cell.isNode) {
      if (cell.nodeColor !== currentDrag.color) return
      if (cell.pairId !== currentDrag.pairId) return

      // Reached the target node - complete the connection!
      const newPath = [...currentDrag.path, { row, col }]

      // Update board with path
      const newBoard = flowBoard.map(r => r.map(c => ({ ...c })))
      for (let i = 1; i < newPath.length - 1; i++) {
        newBoard[newPath[i].row][newPath[i].col].color = currentDrag.color
      }
      setFlowBoard(newBoard)

      // Save connection
      const newConnections = new Map(flowConnections)
      newConnections.set(currentDrag.pairId, {
        pairId: currentDrag.pairId,
        path: newPath,
        complete: true
      })
      setFlowConnections(newConnections)

      // Clear current drag
      setCurrentDrag(null)

      // Check if puzzle is complete
      checkFlowComplete(newBoard, newConnections)
      return
    }

    // Can't go to already occupied cells in current path
    if (currentDrag.path.some(p => p.row === row && p.col === col)) return

    // LENIENT CONNECTION: Check if we're adjacent to target node
    // If so, auto-complete the connection (but exclude the starting node!)
    const size = flowBoard.length
    const startNode = currentDrag.path[0] // The node where we started
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]]
    for (const [dr, dc] of directions) {
      const checkRow = row + dr
      const checkCol = col + dc
      if (checkRow >= 0 && checkRow < size && checkCol >= 0 && checkCol < size) {
        const adjacentCell = flowBoard[checkRow][checkCol]
        // Make sure this is NOT the starting node (must have path length > 2 to complete)
        const isStartNode = checkRow === startNode.row && checkCol === startNode.col
        if (adjacentCell.isNode &&
            adjacentCell.pairId === currentDrag.pairId &&
            adjacentCell.nodeColor === currentDrag.color &&
            !isStartNode &&
            currentDrag.path.length >= 2) { // Require at least 2 cells (start + 1 path cell) before auto-completing
          // Found target node adjacent to current position - auto-complete!
          const completePath = [...currentDrag.path, { row, col }, { row: checkRow, col: checkCol }]

          // Update board with complete path
          const newBoard = flowBoard.map(r => r.map(c => ({ ...c })))
          for (let i = 1; i < completePath.length - 1; i++) {
            newBoard[completePath[i].row][completePath[i].col].color = currentDrag.color
          }
          setFlowBoard(newBoard)

          // Save connection
          const newConnections = new Map(flowConnections)
          newConnections.set(currentDrag.pairId, {
            pairId: currentDrag.pairId,
            path: completePath,
            complete: true
          })
          setFlowConnections(newConnections)

          // Clear current drag
          setCurrentDrag(null)

          // Check if puzzle is complete
          checkFlowComplete(newBoard, newConnections)
          return
        }
      }
    }

    // Add to path (normal behavior)
    const newPath = [...currentDrag.path, { row, col }]
    setCurrentDrag({
      ...currentDrag,
      path: newPath
    })

    // Update board
    const newBoard = flowBoard.map(r => r.map(c => ({ ...c })))
    newBoard[row][col].color = currentDrag.color
    setFlowBoard(newBoard)
  }

  const handleFlowMouseUp = () => {
    // If drag didn't complete to target node, clear the incomplete path
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

  // Flow puzzle interaction - Touch events for mobile
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

  const handleCorruptedTab = () => {
    setIsGlitching(true)
    setGlitchPhase(0)

    // Phase 1: First glitch
    setTimeout(() => setGlitchPhase(1), 200)

    // Phase 2: Second glitch
    setTimeout(() => setGlitchPhase(2), 500)

    // Phase 3: Third glitch
    setTimeout(() => setGlitchPhase(3), 800)

    // Phase 4: Bluescreen
    setTimeout(() => {
      setIsGlitching(false)
      setShowBluescreen(true)
    }, 1200)
  }

  const checkFlowComplete = (board: FlowCell[][], connections: Map<number, FlowConnection>) => {
    const size = board.length

    // Count unique pair IDs from nodes on the board
    const uniquePairIds = new Set<number>()
    flowNodes.forEach(node => uniquePairIds.add(node.pairId))
    const pairCount = uniquePairIds.size

    // Check all pairs are connected
    if (connections.size !== pairCount) return

    // Check all connections are complete
    for (const conn of connections.values()) {
      if (!conn.complete) return
    }

    // Check ALL cells are covered (either node or path)
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        if (!board[i][j].isNode && !board[i][j].color) {
          return // Found empty cell
        }
      }
    }

    // All conditions met - level complete!
    setTimeout(() => {
      if (flowLevel < 3) {
        setFlowLevel(flowLevel + 1)
        // Don't call initFlowPuzzle here - useEffect will handle it
      } else {
        if (user) {
          savePuzzleProgress('flow', true)
        }
        setFlowUnlocked(true)
      }
    }, 500)
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
          // Don't call initLightingPuzzle here - useEffect will handle it
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
          // Don't call initSlidingPuzzle here - useEffect will handle it
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
          }
          if (progress.puzzle_type === 'sliding' && progress.unlocked) {
            setSlidingUnlocked(true)
          }
          if (progress.puzzle_type === 'flow' && progress.unlocked) {
            setFlowUnlocked(true)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, supabase, tracked])

  useEffect(() => {
    initLightingPuzzle(lightingLevel)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightingLevel])

  useEffect(() => {
    initSlidingPuzzle(slidingLevel)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slidingLevel])

  useEffect(() => {
    initFlowPuzzle(flowLevel)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flowLevel])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-300 via-pink-400 to-purple-500 flex items-center justify-center">
        <div className="text-white font-mono text-xl animate-pulse">loading...</div>
      </div>
    )
  }

  // Render bluescreen if active
  if (showBluescreen) {
    return <Bluescreen />
  }

  // Glitch effect styles
  const glitchStyles = isGlitching ? {
    filter: `hue-rotate(${glitchPhase * 90}deg) brightness(${1 + glitchPhase * 0.3})`,
    transform: `translate(${(glitchPhase % 2) * 5}px, ${(glitchPhase % 3) * 3}px) scale(${1 + glitchPhase * 0.02})`,
    transition: 'none'
  } : {}

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-300 via-pink-400 to-purple-500 animate-gradient" style={glitchStyles}>
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
              <TabsTrigger value="flow" className="font-mono font-bold data-[state=active]:bg-blue-400 data-[state=active]:text-white">
                <Waypoints className="mr-2" size={16} />
                Flow
              </TabsTrigger>
              <button
                onClick={handleCorruptedTab}
                className="font-mono font-bold bg-gradient-to-r from-red-500 via-purple-500 to-orange-500 text-white hover:from-red-600 hover:via-purple-600 hover:to-orange-600 transition-all px-3 py-2 rounded-sm flex items-center justify-center gap-2"
                style={{
                  fontFamily: 'monospace',
                  letterSpacing: '2px'
                }}
              >
                <AlertTriangle className="animate-pulse" size={16} />
                �¤Ã¹EÍŸˆœ
              </button>
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

            {/* Flow Puzzle */}
            <TabsContent value="flow" className="mt-6">
              <Card className="border-4 border-blue-400 bg-white/90 backdrop-blur-lg shadow-2xl">
                <CardHeader>
                  <CardTitle className="font-mono text-2xl text-purple-900 flex items-center gap-2">
                    <Waypoints className="text-blue-500" />
                    Flow Puzzle - Level {flowLevel}
                  </CardTitle>
                  <CardDescription className="font-mono text-purple-700 font-semibold">
                    {flowUnlocked
                      ? '✅ All levels complete! Advance button unlocked!'
                      : 'Connect matching colored nodes! Fill every cell without crossing paths.'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col items-center gap-4">
                    <div
                      className="inline-grid gap-1 p-4 bg-gradient-to-br from-cyan-100 to-blue-100 rounded-lg border-4 border-blue-400"
                      onMouseUp={handleFlowMouseUp}
                      onMouseLeave={handleFlowMouseUp}
                      onTouchEnd={handleFlowTouchEnd}
                      onTouchMove={handleFlowTouchMove}
                      style={{
                        gridTemplateColumns: `repeat(${flowBoard.length}, minmax(0, 1fr))`,
                        userSelect: 'none',
                        touchAction: 'none'
                      }}
                    >
                      {flowBoard.map((row, i) => (
                        row.map((cell, j) => {
                          // Dynamic cell size based on grid size
                          const cellSize = flowBoard.length === 6
                            ? 'w-12 h-12 md:w-14 md:h-14'
                            : flowBoard.length === 8
                            ? 'w-10 h-10 md:w-11 md:h-11'
                            : 'w-8 h-8 md:w-9 md:h-9' // 10x10
                          const nodeDotSize = flowBoard.length === 6
                            ? 'w-6 h-6 md:w-7 md:h-7'
                            : flowBoard.length === 8
                            ? 'w-5 h-5 md:w-6 md:h-6'
                            : 'w-4 h-4 md:w-5 md:h-5' // 10x10

                          return (
                            <div
                              key={`${i}-${j}`}
                              data-flow-cell="true"
                              data-flow-row={i}
                              data-flow-col={j}
                              onMouseDown={() => handleFlowMouseDown(i, j)}
                              onMouseEnter={() => handleFlowMouseEnter(i, j)}
                              onTouchStart={(e) => handleFlowTouchStart(e, i, j)}
                              className={`${cellSize} rounded-md border-2 transition-all duration-100 cursor-pointer ${
                                cell.isNode ? 'border-gray-800' : 'border-gray-300'
                              }`}
                              style={{
                                backgroundColor: cell.isNode ? cell.nodeColor : (cell.color || '#f3f4f6'),
                                boxShadow: cell.isNode ? '0 4px 6px rgba(0,0,0,0.3)' : 'none'
                              }}
                            >
                              {cell.isNode && (
                                <div className="w-full h-full flex items-center justify-center">
                                  <div
                                    className={`${nodeDotSize} rounded-full border-4 border-white`}
                                    style={{ backgroundColor: cell.nodeColor }}
                                  />
                                </div>
                              )}
                            </div>
                          )
                        })
                      ))}
                    </div>
                    <p className="text-sm font-mono text-purple-600">
                      Grid Size: {flowBoard.length}x{flowBoard.length} | Level {flowLevel}/3
                    </p>
                  </div>

                  {/* Always show Advance button */}
                  <div className="text-center pt-4 border-t border-blue-300">
                    <Link href="/pipeworks">
                      <Button
                        disabled={!flowUnlocked}
                        className="font-mono text-lg bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-6 px-8 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {flowUnlocked ? 'Advance →' : '🔒 Complete Level 3 to Unlock'}
                      </Button>
                    </Link>
                    {flowUnlocked && (
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
