'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { recordPageDiscovery } from '@/lib/utils'

export default function EndOfTheEndPage() {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [tracked, setTracked] = useState(false)
  const [scrollHeight, setScrollHeight] = useState(200000)
  const [hiddenTexts, setHiddenTexts] = useState<Array<{ top: number; left: number }>>([])
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    const trackDiscovery = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)

      if (user && !tracked) {
      await recordPageDiscovery(supabase, user.id, 'endoftheend')
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
        const newHeight = scrollHeight + 100000
        setScrollHeight(newHeight)

        // 1/10 chance to add hidden text
        if (Math.random() < 0.1) {
          const randomTop = scrollHeight + Math.random() * 80000 + 10000
          const randomLeft = Math.random() * 80 + 10 // 10% to 90% of width

          setHiddenTexts(prev => [...prev, {
            top: randomTop,
            left: randomLeft
          }])
        }
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-black" />
    )
  }

  return (
    <div
      ref={scrollContainerRef}
      className="bg-black relative"
      style={{
        minHeight: `${scrollHeight}px`,
        width: '100%'
      }}
    >
      {hiddenTexts.map((text, index) => (
        <a
          key={index}
          href="/unwarp/beginningofthebeginning"
          className="absolute font-mono text-sm select-text cursor-text"
          style={{
            top: `${text.top}px`,
            left: `${text.left}%`,
            color: '#000000',
            textDecoration: 'none'
          }}
        >
          /unwarp/beginningofthebeginning
        </a>
      ))}
    </div>
  )
}
