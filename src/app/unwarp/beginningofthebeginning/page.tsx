'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function BeginningOfTheBeginningPage() {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [tracked, setTracked] = useState(false)
  const [scrollHeight, setScrollHeight] = useState(200000)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    const trackDiscovery = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)

      if (user && !tracked) {
        await supabase.rpc('record_page_discovery', {
          p_user_id: user.id,
          p_page_key: 'beginningofthebeginning'
        })
        setTracked(true)
      }
    }

    trackDiscovery()
  }, [supabase, tracked])

  useEffect(() => {
    const handleScroll = () => {
      if (!scrollContainerRef.current) return

      const { scrollTop, scrollHeight, clientHeight } = document.documentElement
      const scrollPercentage = (scrollTop + clientHeight) / scrollHeight

      // When user scrolls past 70%, add more height
      if (scrollPercentage > 0.7) {
        setScrollHeight(prev => prev + 100000)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-white" />
    )
  }

  return (
    <div
      ref={scrollContainerRef}
      className="bg-white"
      style={{
        minHeight: `${scrollHeight}px`,
        width: '100%'
      }}
    />
  )
}
