'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function CelestialInfernoPage() {
  const [tracked, setTracked] = useState(false)
  const [progress, setProgress] = useState(0) // 0 to 100 representing 0s to 10s
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const trackDiscovery = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (user && !tracked) {
        // Track page discovery
        await supabase.rpc('record_page_discovery', {
          p_user_id: user.id,
          p_page_key: 'celestialinferno'
        })
        setTracked(true)
      }
    }

    trackDiscovery()

    // Smooth progress animation
    const startTime = Date.now()
    const duration = 10000 // 10 seconds

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const newProgress = Math.min((elapsed / duration) * 100, 100)
      setProgress(newProgress)

      if (newProgress >= 100) {
        clearInterval(interval)
        router.push('/')
      }
    }, 16) // ~60fps

    return () => clearInterval(interval)
  }, [supabase, tracked, router])

  // Interpolate colors based on progress
  const getGradientStyle = () => {
    // Color stops: red (0-25%), orange (25-50%), yellow (50-75%), white (75-100%)
    const red = { r: 220, g: 38, b: 38 }       // #dc2626
    const orange = { r: 249, g: 115, b: 22 }   // #f97316
    const yellow = { r: 250, g: 204, b: 21 }   // #facc15
    const white = { r: 255, g: 255, b: 255 }   // #ffffff

    let color1, color2, localProgress

    if (progress < 33.33) {
      // Red to Orange
      color1 = red
      color2 = orange
      localProgress = progress / 33.33
    } else if (progress < 66.66) {
      // Orange to Yellow
      color1 = orange
      color2 = yellow
      localProgress = (progress - 33.33) / 33.33
    } else {
      // Yellow to White
      color1 = yellow
      color2 = white
      localProgress = (progress - 66.66) / 33.34
    }

    // Linear interpolation between colors
    const r = Math.round(color1.r + (color2.r - color1.r) * localProgress)
    const g = Math.round(color1.g + (color2.g - color1.g) * localProgress)
    const b = Math.round(color1.b + (color2.b - color1.b) * localProgress)

    return {
      backgroundColor: `rgb(${r}, ${g}, ${b})`,
      transition: 'background-color 16ms linear'
    }
  }

  return (
    <div className="min-h-screen" style={getGradientStyle()} />
  )
}
