'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function CelestialInfernoPage() {
  const [tracked, setTracked] = useState(false)
  const [colorPhase, setColorPhase] = useState(0) // 0: red, 1: orange, 2: yellow, 3: white
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

    // Color transition sequence
    const phase1 = setTimeout(() => setColorPhase(1), 2500) // After 2.5s -> orange
    const phase2 = setTimeout(() => setColorPhase(2), 5000) // After 5s -> yellow
    const phase3 = setTimeout(() => setColorPhase(3), 7500) // After 7.5s -> white
    const redirect = setTimeout(() => router.push('/'), 10000) // After 10s -> redirect

    return () => {
      clearTimeout(phase1)
      clearTimeout(phase2)
      clearTimeout(phase3)
      clearTimeout(redirect)
    }
  }, [supabase, tracked, router])

  const getBackgroundColor = () => {
    switch (colorPhase) {
      case 0:
        return 'bg-red-600'
      case 1:
        return 'bg-orange-500'
      case 2:
        return 'bg-yellow-400'
      case 3:
        return 'bg-white'
      default:
        return 'bg-red-600'
    }
  }

  return (
    <div className={`min-h-screen ${getBackgroundColor()} transition-colors duration-[2500ms] ease-in-out`} />
  )
}
