'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { recordPageDiscovery } from '@/lib/utils'
import { useRouter } from 'next/navigation'

interface Pipe {
  x: number
  y: number
  segments: PipeSegment[]
  color: string
  width: number
}

interface PipeSegment {
  type: 'horizontal' | 'vertical' | 'corner-tl' | 'corner-tr' | 'corner-bl' | 'corner-br'
  x: number
  y: number
  length: number
}

const PIPE_COLORS = [
  '#64748b', // gray
  '#71717a', // zinc
  '#52525b', // neutral
  '#57534e', // stone
  '#78716c', // warm gray
  '#475569', // slate
  '#6b7280', // cool gray
]

const SEGMENT_SIZE = 40
const PIPE_WIDTH_MIN = 8
const PIPE_WIDTH_MAX = 16

export default function PipeworksPage() {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [pipes, setPipes] = useState<Pipe[]>([])
  const canvasRef = useRef<HTMLCanvasElement>(null)
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

  // Generate a random pipe path
  const generatePipe = (startX: number, startY: number): Pipe => {
    const segments: PipeSegment[] = []
    const segmentCount = 8 + Math.floor(Math.random() * 12) // 8-20 segments
    let currentX = startX
    let currentY = startY
    let lastDirection: 'horizontal' | 'vertical' = Math.random() > 0.5 ? 'horizontal' : 'vertical'

    for (let i = 0; i < segmentCount; i++) {
      const length = SEGMENT_SIZE * (2 + Math.floor(Math.random() * 4)) // 2-6 units long

      if (lastDirection === 'horizontal') {
        // Add horizontal segment
        segments.push({
          type: 'horizontal',
          x: currentX,
          y: currentY,
          length
        })
        currentX += length

        // Add corner
        if (i < segmentCount - 1) {
          const goDown = Math.random() > 0.5
          segments.push({
            type: goDown ? 'corner-bl' : 'corner-tl',
            x: currentX,
            y: currentY,
            length: SEGMENT_SIZE
          })
          currentY += goDown ? SEGMENT_SIZE : -SEGMENT_SIZE
          lastDirection = 'vertical'
        }
      } else {
        // Add vertical segment
        segments.push({
          type: 'vertical',
          x: currentX,
          y: currentY,
          length
        })
        currentY += length

        // Add corner
        if (i < segmentCount - 1) {
          const goRight = Math.random() > 0.5
          segments.push({
            type: goRight ? 'corner-tr' : 'corner-tl',
            x: currentX,
            y: currentY,
            length: SEGMENT_SIZE
          })
          currentX += goRight ? SEGMENT_SIZE : -SEGMENT_SIZE
          lastDirection = 'horizontal'
        }
      }
    }

    return {
      x: startX,
      y: startY,
      segments,
      color: PIPE_COLORS[Math.floor(Math.random() * PIPE_COLORS.length)],
      width: PIPE_WIDTH_MIN + Math.floor(Math.random() * (PIPE_WIDTH_MAX - PIPE_WIDTH_MIN))
    }
  }

  // Generate pipes for a grid region
  const generatePipesForRegion = (centerX: number, centerY: number, width: number, height: number): Pipe[] => {
    const newPipes: Pipe[] = []
    const pipeCount = 40 // Dense packing

    for (let i = 0; i < pipeCount; i++) {
      const startX = centerX - width / 2 + Math.random() * width
      const startY = centerY - height / 2 + Math.random() * height
      newPipes.push(generatePipe(startX, startY))
    }

    return newPipes
  }

  // Initialize pipes on mount
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current
      const initialPipes = generatePipesForRegion(0, 0, canvas.width * 3, canvas.height * 3)
      setPipes(initialPipes)
    }
  }, [])

  // Draw pipes on canvas
  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    // Clear canvas
    ctx.fillStyle = '#1a1a1a'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw all pipes
    pipes.forEach(pipe => {
      ctx.strokeStyle = pipe.color
      ctx.lineWidth = pipe.width
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      pipe.segments.forEach(segment => {
        const screenX = segment.x + offset.x + canvas.width / 2
        const screenY = segment.y + offset.y + canvas.height / 2

        ctx.beginPath()

        switch (segment.type) {
          case 'horizontal':
            ctx.moveTo(screenX, screenY)
            ctx.lineTo(screenX + segment.length, screenY)
            break
          case 'vertical':
            ctx.moveTo(screenX, screenY)
            ctx.lineTo(screenX, screenY + segment.length)
            break
          case 'corner-tl':
            // Top-left to bottom-right corner
            ctx.arc(screenX + segment.length, screenY, segment.length, Math.PI, Math.PI * 1.5)
            break
          case 'corner-tr':
            // Top-right to bottom-left corner
            ctx.arc(screenX, screenY, segment.length, 0, Math.PI * 0.5)
            break
          case 'corner-bl':
            // Bottom-left to top-right corner
            ctx.arc(screenX + segment.length, screenY, segment.length, Math.PI * 0.5, Math.PI)
            break
          case 'corner-br':
            // Bottom-right to top-left corner
            ctx.arc(screenX, screenY, segment.length, Math.PI * 1.5, Math.PI * 2)
            break
        }

        ctx.stroke()
      })
    })

    // Generate more pipes when user drags far enough
    const maxDistance = Math.max(Math.abs(offset.x), Math.abs(offset.y))
    if (maxDistance > canvas.width && pipes.length < 200) {
      const newPipes = generatePipesForRegion(offset.x, offset.y, canvas.width * 2, canvas.height * 2)
      setPipes(prev => [...prev, ...newPipes])
    }
  }, [offset, pipes])

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
    <div className="fixed inset-0 overflow-hidden bg-[#1a1a1a]" style={{ cursor: isDragging ? 'grabbing' : 'grab' }}>
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
