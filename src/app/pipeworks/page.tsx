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

export default function PipeworksPage() {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [pipes, setPipes] = useState<Pipe[]>([])
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

  // Generate initial pipes centered around viewport
  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2

    const initialPipes: Pipe[] = []
    const pipeCount = 50

    for (let i = 0; i < pipeCount; i++) {
      const startX = centerX + (Math.random() - 0.5) * 1600
      const startY = centerY + (Math.random() - 0.5) * 1200
      initialPipes.push(generatePipe(startX, startY))
    }

    setPipes(initialPipes)
  }, [])

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

  // Generate more pipes when dragging far
  useEffect(() => {
    if (!canvasRef.current || pipes.length === 0) return

    const canvas = canvasRef.current
    const distance = Math.sqrt(offset.x * offset.x + offset.y * offset.y)

    // Generate more pipes if dragged more than 800px and have less than 200 pipes
    if (distance > 800 && pipes.length < 200) {
      const newPipes: Pipe[] = []
      const pipeCount = 20

      for (let i = 0; i < pipeCount; i++) {
        const angle = Math.random() * Math.PI * 2
        const dist = 600 + Math.random() * 400
        const startX = canvas.width / 2 - offset.x + Math.cos(angle) * dist
        const startY = canvas.height / 2 - offset.y + Math.sin(angle) * dist
        newPipes.push(generatePipe(startX, startY))
      }

      setPipes(prev => [...prev, ...newPipes])
    }
  }, [offset, pipes.length])

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
