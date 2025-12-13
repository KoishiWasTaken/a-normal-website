'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { recordPageDiscovery } from '@/lib/utils'
import { useRouter } from 'next/navigation'

interface Point {
  x: number
  y: number
}

interface PipeSegment {
  start: Point
  end: Point
  type: 'horizontal' | 'vertical'
}

interface PipeJoint {
  pos: Point
  type: 'elbow' | 't-joint' | 'cross' | 'valve' | 'straight'
  rotation: number // 0, 90, 180, 270
}

interface Pipe {
  segments: PipeSegment[]
  joints: PipeJoint[]
  color: string
  width: number
}

const PIPE_COLORS = [
  '#52525b', // zinc-600
  '#71717a', // zinc-500
  '#3f3f46', // zinc-700
  '#27272a', // zinc-800
  '#57534e', // stone-600
  '#78716c', // stone-500
]

const PIPE_WIDTH_MIN = 20
const PIPE_WIDTH_MAX = 35
const CHUNK_SIZE = 800
const GRID_SIZE = 80
const PIPES_PER_CHUNK = 4

export default function PipeworksPage() {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [pipes, setPipes] = useState<Pipe[]>([])
  const [generatedChunks, setGeneratedChunks] = useState<Set<string>>(new Set())
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/signin')
        return
      }

      setUser(user)
      await recordPageDiscovery(supabase, user.id, 'pipeworks')
    }

    init()
  }, [router, supabase])

  // Seeded random for consistent chunk generation
  const seededRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000
    return x - Math.floor(x)
  }

  // Generate a grid-aligned pipe that connects edge to edge
  const generatePipe = (chunkX: number, chunkY: number, pipeIndex: number): Pipe => {
    const seed = chunkX * 1000 + chunkY * 100 + pipeIndex
    const segments: PipeSegment[] = []
    const joints: PipeJoint[] = []

    const chunkBaseX = chunkX * CHUNK_SIZE
    const chunkBaseY = chunkY * CHUNK_SIZE

    // Pipe starts at a random edge point
    const startEdge = Math.floor(seededRandom(seed) * 4) // 0=top, 1=right, 2=bottom, 3=left
    const startOffset = Math.floor(seededRandom(seed + 1) * (CHUNK_SIZE / GRID_SIZE)) * GRID_SIZE

    // Pick an exit edge (must be different from start edge)
    let exitEdge = Math.floor(seededRandom(seed + 200) * 3)
    if (exitEdge >= startEdge) exitEdge++ // Skip the start edge
    const exitOffset = Math.floor(seededRandom(seed + 201) * (CHUNK_SIZE / GRID_SIZE)) * GRID_SIZE

    let currentX: number, currentY: number
    let targetX: number, targetY: number
    let direction: 'up' | 'down' | 'left' | 'right'

    // Set start position and initial direction
    switch (startEdge) {
      case 0: // top
        currentX = chunkBaseX + startOffset
        currentY = chunkBaseY
        direction = 'down'
        break
      case 1: // right
        currentX = chunkBaseX + CHUNK_SIZE
        currentY = chunkBaseY + startOffset
        direction = 'left'
        break
      case 2: // bottom
        currentX = chunkBaseX + startOffset
        currentY = chunkBaseY + CHUNK_SIZE
        direction = 'up'
        break
      default: // left
        currentX = chunkBaseX
        currentY = chunkBaseY + startOffset
        direction = 'right'
    }

    // Set target exit position
    switch (exitEdge) {
      case 0: // top
        targetX = chunkBaseX + exitOffset
        targetY = chunkBaseY
        break
      case 1: // right
        targetX = chunkBaseX + CHUNK_SIZE
        targetY = chunkBaseY + exitOffset
        break
      case 2: // bottom
        targetX = chunkBaseX + exitOffset
        targetY = chunkBaseY + CHUNK_SIZE
        break
      default: // left
        targetX = chunkBaseX
        targetY = chunkBaseY + exitOffset
    }

    // Navigate from start to target using grid-aligned segments
    const maxSegments = 15
    let segmentCount = 0

    while ((currentX !== targetX || currentY !== targetY) && segmentCount < maxSegments) {
      const startX = currentX
      const startY = currentY

      // Decide whether to move horizontally or vertically toward target
      const needsHorizontal = currentX !== targetX
      const needsVertical = currentY !== targetY

      let moveHorizontal = false
      if (needsHorizontal && needsVertical) {
        // Randomly choose, but prefer current direction if it helps
        const randChoice = seededRandom(seed + segmentCount * 10)
        if (direction === 'left' || direction === 'right') {
          moveHorizontal = randChoice < 0.7 // Prefer to continue in same axis
        } else {
          moveHorizontal = randChoice < 0.3 // Prefer to turn
        }
      } else {
        moveHorizontal = needsHorizontal
      }

      // Calculate segment length (move partway toward target)
      let segmentLength: number
      if (moveHorizontal) {
        const distToTarget = Math.abs(targetX - currentX)
        const maxMove = Math.min(distToTarget, GRID_SIZE * 3)
        segmentLength = GRID_SIZE + Math.floor(seededRandom(seed + segmentCount * 11) * (maxMove / GRID_SIZE - 1)) * GRID_SIZE
        segmentLength = Math.min(segmentLength, distToTarget)

        if (targetX > currentX) {
          direction = 'right'
          currentX += segmentLength
        } else {
          direction = 'left'
          currentX -= segmentLength
        }
        segments.push({ start: { x: startX, y: startY }, end: { x: currentX, y: currentY }, type: 'horizontal' })
      } else {
        const distToTarget = Math.abs(targetY - currentY)
        const maxMove = Math.min(distToTarget, GRID_SIZE * 3)
        segmentLength = GRID_SIZE + Math.floor(seededRandom(seed + segmentCount * 11) * (maxMove / GRID_SIZE - 1)) * GRID_SIZE
        segmentLength = Math.min(segmentLength, distToTarget)

        if (targetY > currentY) {
          direction = 'down'
          currentY += segmentLength
        } else {
          direction = 'up'
          currentY -= segmentLength
        }
        segments.push({ start: { x: startX, y: startY }, end: { x: currentX, y: currentY }, type: 'vertical' })
      }

      // Add joint if not at target yet
      if (currentX !== targetX || currentY !== targetY) {
        // Randomly pick a joint type
        const jointRand = seededRandom(seed + segmentCount * 12)
        let jointType: PipeJoint['type']

        if (jointRand < 0.05) {
          jointType = 'valve'
        } else if (jointRand < 0.15) {
          jointType = 't-joint'
        } else if (jointRand < 0.2) {
          jointType = 'cross'
        } else if (jointRand < 0.5) {
          jointType = 'elbow'
        } else {
          jointType = 'straight'
        }

        // Calculate rotation based on current direction
        let rotation = 0
        if (direction === 'right') rotation = 0
        else if (direction === 'down') rotation = 90
        else if (direction === 'left') rotation = 180
        else rotation = 270

        joints.push({
          pos: { x: currentX, y: currentY },
          type: jointType,
          rotation
        })
      }

      segmentCount++
    }

    return {
      segments,
      joints,
      color: PIPE_COLORS[Math.floor(seededRandom(seed + 100) * PIPE_COLORS.length)],
      width: PIPE_WIDTH_MIN + Math.floor(seededRandom(seed + 101) * (PIPE_WIDTH_MAX - PIPE_WIDTH_MIN))
    }
  }

  // Generate pipes for a specific chunk
  const generateChunkPipes = (chunkX: number, chunkY: number): Pipe[] => {
    const newPipes: Pipe[] = []

    for (let i = 0; i < PIPES_PER_CHUNK; i++) {
      newPipes.push(generatePipe(chunkX, chunkY, i))
    }

    return newPipes
  }

  // Generate chunks around current viewport
  const generateVisibleChunks = () => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current

    // Calculate viewport bounds in world space
    const viewLeft = -offset.x
    const viewRight = -offset.x + canvas.width
    const viewTop = -offset.y
    const viewBottom = -offset.y + canvas.height

    // Add buffer area around viewport
    const buffer = CHUNK_SIZE * 2
    const worldLeft = viewLeft - buffer
    const worldRight = viewRight + buffer
    const worldTop = viewTop - buffer
    const worldBottom = viewBottom + buffer

    // Calculate chunk range to generate
    const startChunkX = Math.floor(worldLeft / CHUNK_SIZE)
    const endChunkX = Math.ceil(worldRight / CHUNK_SIZE)
    const startChunkY = Math.floor(worldTop / CHUNK_SIZE)
    const endChunkY = Math.ceil(worldBottom / CHUNK_SIZE)

    const newPipes: Pipe[] = []
    const newChunks = new Set(generatedChunks)

    // Generate all chunks in viewport + buffer
    for (let chunkX = startChunkX; chunkX <= endChunkX; chunkX++) {
      for (let chunkY = startChunkY; chunkY <= endChunkY; chunkY++) {
        const chunkKey = `${chunkX},${chunkY}`

        if (!generatedChunks.has(chunkKey)) {
          newChunks.add(chunkKey)
          newPipes.push(...generateChunkPipes(chunkX, chunkY))
        }
      }
    }

    if (newPipes.length > 0) {
      setPipes(prev => [...prev, ...newPipes])
      setGeneratedChunks(newChunks)
    }
  }

  // Generate initial chunks
  useEffect(() => {
    if (canvasRef.current) {
      generateVisibleChunks()
    }
  }, [])

  // Generate new chunks whenever offset changes
  useEffect(() => {
    generateVisibleChunks()
  }, [offset])

  // Draw a pipe joint
  const drawJoint = (ctx: CanvasRenderingContext2D, joint: PipeJoint, x: number, y: number, width: number, color: string) => {
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate((joint.rotation * Math.PI) / 180)

    const radius = width * 0.7

    switch (joint.type) {
      case 'elbow':
        // 90-degree elbow
        ctx.strokeStyle = '#00000060'
        ctx.lineWidth = width + 6
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.arc(0, 0, radius + 3, Math.PI, Math.PI * 1.5)
        ctx.stroke()

        ctx.strokeStyle = color
        ctx.lineWidth = width
        ctx.beginPath()
        ctx.arc(0, 0, radius, Math.PI, Math.PI * 1.5)
        ctx.stroke()

        // Flange
        ctx.fillStyle = color
        ctx.fillRect(-radius * 1.3, -radius * 0.3, radius * 0.4, radius * 0.6)
        ctx.fillRect(-radius * 0.3, -radius * 1.3, radius * 0.6, radius * 0.4)
        break

      case 't-joint':
        // T-junction
        ctx.fillStyle = '#00000060'
        ctx.beginPath()
        ctx.arc(2, 2, radius * 1.2, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = color
        ctx.beginPath()
        ctx.arc(0, 0, radius * 1.2, 0, Math.PI * 2)
        ctx.fill()

        // Bolts
        const boltPositions = [
          { x: radius * 0.7, y: 0 },
          { x: -radius * 0.7, y: 0 },
          { x: 0, y: radius * 0.7 },
          { x: 0, y: -radius * 0.7 }
        ]
        ctx.fillStyle = '#00000040'
        boltPositions.forEach(bolt => {
          ctx.beginPath()
          ctx.arc(bolt.x, bolt.y, width * 0.15, 0, Math.PI * 2)
          ctx.fill()
        })
        break

      case 'cross':
        // Cross junction
        ctx.fillStyle = '#00000060'
        ctx.beginPath()
        ctx.arc(2, 2, radius * 1.3, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = color
        ctx.beginPath()
        ctx.arc(0, 0, radius * 1.3, 0, Math.PI * 2)
        ctx.fill()

        // Highlight
        ctx.fillStyle = '#ffffff15'
        ctx.beginPath()
        ctx.arc(-radius * 0.3, -radius * 0.3, radius * 0.5, 0, Math.PI * 2)
        ctx.fill()
        break

      case 'valve':
        // Valve handle
        ctx.fillStyle = '#00000060'
        ctx.fillRect(-width * 0.4 + 2, -width * 1.2 + 2, width * 0.8, width * 2.4)

        ctx.fillStyle = color
        ctx.fillRect(-width * 0.4, -width * 1.2, width * 0.8, width * 2.4)

        // Wheel
        ctx.strokeStyle = '#00000060'
        ctx.lineWidth = width * 0.3
        ctx.beginPath()
        ctx.arc(2, -width * 0.8 + 2, width * 0.5, 0, Math.PI * 2)
        ctx.stroke()

        ctx.strokeStyle = '#e11d48' // Red accent for valve
        ctx.lineWidth = width * 0.25
        ctx.beginPath()
        ctx.arc(0, -width * 0.8, width * 0.5, 0, Math.PI * 2)
        ctx.stroke()

        // Spokes
        ctx.beginPath()
        ctx.moveTo(0, -width * 0.8 - width * 0.5)
        ctx.lineTo(0, -width * 0.8 + width * 0.5)
        ctx.moveTo(-width * 0.5, -width * 0.8)
        ctx.lineTo(width * 0.5, -width * 0.8)
        ctx.stroke()
        break

      case 'straight':
        // Simple coupling
        ctx.fillStyle = '#00000060'
        ctx.fillRect(-width * 0.5 + 2, -width * 0.6 + 2, width, width * 1.2)

        ctx.fillStyle = color
        ctx.fillRect(-width * 0.5, -width * 0.6, width, width * 1.2)

        // Ridges
        for (let i = -1; i <= 1; i++) {
          ctx.strokeStyle = '#00000020'
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.moveTo(-width * 0.5, i * width * 0.3)
          ctx.lineTo(width * 0.5, i * width * 0.3)
          ctx.stroke()
        }
        break
    }

    ctx.restore()
  }

  // Draw loop
  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const draw = () => {
      // Resize canvas to window
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight

      // Clear with dark background
      ctx.fillStyle = '#0a0a0a'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw all pipes
      pipes.forEach(pipe => {
        // Draw segments
        pipe.segments.forEach(segment => {
          const startX = segment.start.x + offset.x
          const startY = segment.start.y + offset.y
          const endX = segment.end.x + offset.x
          const endY = segment.end.y + offset.y

          // Check if segment is visible
          const minX = Math.min(startX, endX)
          const maxX = Math.max(startX, endX)
          const minY = Math.min(startY, endY)
          const maxY = Math.max(startY, endY)

          if (maxX < -100 || minX > canvas.width + 100 || maxY < -100 || minY > canvas.height + 100) {
            return
          }

          // Shadow
          ctx.strokeStyle = '#00000060'
          ctx.lineWidth = pipe.width + 6
          ctx.lineCap = 'square'
          ctx.beginPath()
          ctx.moveTo(startX + 3, startY + 3)
          ctx.lineTo(endX + 3, endY + 3)
          ctx.stroke()

          // Main pipe
          ctx.strokeStyle = pipe.color
          ctx.lineWidth = pipe.width
          ctx.beginPath()
          ctx.moveTo(startX, startY)
          ctx.lineTo(endX, endY)
          ctx.stroke()

          // Highlight
          ctx.strokeStyle = '#ffffff15'
          ctx.lineWidth = pipe.width * 0.4
          ctx.beginPath()
          if (segment.type === 'horizontal') {
            ctx.moveTo(startX, startY - pipe.width / 3)
            ctx.lineTo(endX, endY - pipe.width / 3)
          } else {
            ctx.moveTo(startX - pipe.width / 3, startY)
            ctx.lineTo(endX - pipe.width / 3, endY)
          }
          ctx.stroke()
        })

        // Draw joints on top
        pipe.joints.forEach(joint => {
          const x = joint.pos.x + offset.x
          const y = joint.pos.y + offset.y

          // Check if joint is visible
          if (x < -200 || x > canvas.width + 200 || y < -200 || y > canvas.height + 200) {
            return
          }

          drawJoint(ctx, joint, x, y, pipe.width, pipe.color)
        })
      })

      animationFrameRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [pipes, offset])

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true)
      setDragStart({
        x: e.touches[0].clientX - offset.x,
        y: e.touches[0].clientY - offset.y
      })
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return
    e.preventDefault()
    setOffset({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y
    })
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#0a0a0a]" style={{ cursor: isDragging ? 'grabbing' : 'grab' }}>
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="w-full h-full"
        style={{ touchAction: 'none' }}
      />
    </div>
  )
}
