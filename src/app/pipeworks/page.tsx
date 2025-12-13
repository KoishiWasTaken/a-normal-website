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

interface Pipe {
  points: Point[]
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

const PIPE_WIDTH_MIN = 15
const PIPE_WIDTH_MAX = 30
const CHUNK_SIZE = 600 // Size of each chunk
const PIPES_PER_CHUNK = 6 // Pipes generated per chunk

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

  // Generate a simple pipe with smooth path
  const generatePipe = (startX: number, startY: number): Pipe => {
    const points: Point[] = []
    const segments = 4 + Math.floor(Math.random() * 6) // 4-10 segments

    let x = startX
    let y = startY

    points.push({ x, y })

    for (let i = 0; i < segments; i++) {
      // Random direction and length
      const angle = Math.random() * Math.PI * 2
      const length = 80 + Math.random() * 120

      x += Math.cos(angle) * length
      y += Math.sin(angle) * length

      points.push({ x, y })
    }

    return {
      points,
      color: PIPE_COLORS[Math.floor(Math.random() * PIPE_COLORS.length)],
      width: PIPE_WIDTH_MIN + Math.floor(Math.random() * (PIPE_WIDTH_MAX - PIPE_WIDTH_MIN))
    }
  }

  // Get chunk key from world position
  const getChunkKey = (worldX: number, worldY: number): string => {
    const chunkX = Math.floor(worldX / CHUNK_SIZE)
    const chunkY = Math.floor(worldY / CHUNK_SIZE)
    return `${chunkX},${chunkY}`
  }

  // Generate pipes for a specific chunk
  const generateChunkPipes = (chunkX: number, chunkY: number): Pipe[] => {
    const newPipes: Pipe[] = []

    // Use chunk coordinates as seed for consistent generation
    const chunkCenterX = chunkX * CHUNK_SIZE + CHUNK_SIZE / 2
    const chunkCenterY = chunkY * CHUNK_SIZE + CHUNK_SIZE / 2

    for (let i = 0; i < PIPES_PER_CHUNK; i++) {
      const startX = chunkX * CHUNK_SIZE + Math.random() * CHUNK_SIZE
      const startY = chunkY * CHUNK_SIZE + Math.random() * CHUNK_SIZE
      newPipes.push(generatePipe(startX, startY))
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

    // Add buffer area around viewport (2 chunks in each direction)
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
        if (pipe.points.length < 2) return

        // Transform points to screen space
        const screenPoints = pipe.points.map(p => ({
          x: p.x + offset.x,
          y: p.y + offset.y
        }))

        // Check if pipe is visible (simple bounds check)
        const visible = screenPoints.some(p =>
          p.x >= -200 && p.x <= canvas.width + 200 &&
          p.y >= -200 && p.y <= canvas.height + 200
        )

        if (!visible) return

        // Draw pipe shadow
        ctx.strokeStyle = '#00000060'
        ctx.lineWidth = pipe.width + 6
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.beginPath()
        ctx.moveTo(screenPoints[0].x + 3, screenPoints[0].y + 3)
        for (let i = 1; i < screenPoints.length; i++) {
          ctx.lineTo(screenPoints[i].x + 3, screenPoints[i].y + 3)
        }
        ctx.stroke()

        // Draw main pipe
        ctx.strokeStyle = pipe.color
        ctx.lineWidth = pipe.width
        ctx.beginPath()
        ctx.moveTo(screenPoints[0].x, screenPoints[0].y)
        for (let i = 1; i < screenPoints.length; i++) {
          ctx.lineTo(screenPoints[i].x, screenPoints[i].y)
        }
        ctx.stroke()

        // Draw highlight
        ctx.strokeStyle = '#ffffff15'
        ctx.lineWidth = pipe.width * 0.4
        ctx.beginPath()
        ctx.moveTo(screenPoints[0].x, screenPoints[0].y - pipe.width / 3)
        for (let i = 1; i < screenPoints.length; i++) {
          ctx.lineTo(screenPoints[i].x, screenPoints[i].y - pipe.width / 3)
        }
        ctx.stroke()

        // Draw joints at each point
        screenPoints.forEach((point, i) => {
          // Joint shadow
          ctx.fillStyle = '#00000060'
          ctx.beginPath()
          ctx.arc(point.x + 2, point.y + 2, pipe.width * 0.65, 0, Math.PI * 2)
          ctx.fill()

          // Joint body
          ctx.fillStyle = pipe.color
          ctx.beginPath()
          ctx.arc(point.x, point.y, pipe.width * 0.65, 0, Math.PI * 2)
          ctx.fill()

          // Joint highlight
          ctx.fillStyle = '#ffffff20'
          ctx.beginPath()
          ctx.arc(point.x - pipe.width * 0.2, point.y - pipe.width * 0.2, pipe.width * 0.25, 0, Math.PI * 2)
          ctx.fill()
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
