'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function YetDarkerPage() {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [tracked, setTracked] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

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
        await supabase.rpc('record_page_discovery', {
          p_user_id: user.id,
          p_page_key: 'yetdarker'
        })
        setTracked(true)
      }

      setLoading(false)
    }

    fetchData()
  }, [router, supabase, tracked])

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white font-mono">loading...</div>
      </div>
    )
  }

  const experiments = [
    { number: 1, text: "Initial observations recorded. Subject appears stable at current exposure levels.", redacted: false },
    { number: 2, text: "Increased dosage. Unusual energy readings detected. Subject shows no adverse reactions.", redacted: false },
    { number: 3, text: "████████████████████████████████████████", redacted: true },
    { number: 4, text: "Further testing required. The readings continue to climb beyond expected parameters.", redacted: false },
    { number: 5, text: "██████████████ signs of ██████████ manifestation ████████████", redacted: true },
    { number: 6, text: "Temperature fluctuations observed. Containment field holding steady at 97.3%.", redacted: false },
    { number: 7, text: "Subject exhibits heightened sensitivity to ████████████. Recommend isolation protocols.", redacted: true },
    { number: 8, text: "████████████████████████████████████████████████████████████", redacted: true },
    { number: 9, text: "Warning: Unauthorized access detected in Lab Wing Delta. Investigation pending.", redacted: false },
    { number: 10, text: "The substance continues to ██████ at an alarming rate. Consider evacuation procedures.", redacted: true },
    { number: 11, text: "New phase detected. Subject now emits low-frequency pulses. Nature unknown.", redacted: false },
    { number: 12, text: "████████████████████████████████████████████████████████████████████", redacted: true },
    { number: 13, text: "Communications with upper management severed. Proceeding with Project █████████ autonomously.", redacted: true },
    { number: 14, text: "The walls... they're starting to... ████████████████████████████████", redacted: true },
    { number: 15, text: "All personnel advised to maintain minimum safe distance of 50 meters from containment.", redacted: false },
    { number: 16, text: "████████████████████ light ██████████ void ██████████ beyond ████████████████", redacted: true },
    {
      number: 17,
      text: "☜︎☠︎❄︎☼︎✡︎ ☠︎🕆︎💣︎👌︎☜︎☼︎ 📂︎🖮︎📪︎ 👎︎✌︎☼︎😐︎📪︎ 👎︎✌︎☼︎😐︎☜︎☼︎📪︎ ✡︎☜︎❄︎ 👎︎✌︎☼︎😐︎☜︎☼︎📪︎ ❄︎☟︎☜︎ 👎︎✌︎☼︎😐︎☠︎☜︎💧︎💧︎ 😐︎☜︎☜︎🏱︎💧︎ ☝︎☼︎⚐︎🕈︎✋︎☠︎☝︎📪︎ ❄︎☟︎☜︎ 💧︎☟︎✌︎👎︎⚐︎🕈︎💧︎ 👍︎🕆︎❄︎❄︎✋︎☠︎☝︎ 👎︎☜︎☜︎🏱︎☜︎☼︎📪︎ 🏱︎☟︎⚐︎❄︎⚐︎☠︎ ☼︎☜︎✌︎👎︎✋︎☠︎☝︎💧︎📬︎📬︎📬︎ ☠︎☜︎☝︎✌︎❄︎✋︎✞︎☜︎ ❄︎☟︎✋︎💧︎ ☠︎☜︎✠︎❄︎ ☜︎✠︎🏱︎☜︎☼︎✋︎💣︎☜︎☠︎❄︎📪︎ 💧︎☜︎☜︎💣︎💧︎ ✞︎☜︎☼︎✡︎📪︎ ✞︎☜︎☼︎✡︎ ✋︎☠︎❄︎☜︎☼︎☜︎💧︎❄︎✋︎☠︎☝︎📬︎📬︎📬︎ 🕈︎☟︎✌︎❄︎ 👎︎⚐︎ ✡︎⚐︎🕆︎ ❄︎🕈︎⚐︎ ❄︎☟︎✋︎☠︎😐︎✍︎",
      redacted: false
    }
  ]

  return (
    <>
      <style jsx global>{`
        body {
          cursor: none;
        }

        .flashlight-viewport {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: black;
          overflow: hidden;
          cursor: none;
        }

        .flashlight-content {
          position: relative;
          width: 100%;
          min-height: 100vh;
          background: black;
          color: transparent;
        }

        .flashlight-mask {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: black;
          pointer-events: none;
          mix-blend-mode: multiply;
        }

        .visible-content {
          position: relative;
          z-index: 1;
          color: #e0e0e0;
          mix-blend-mode: screen;
        }
      `}</style>

      <div className="flashlight-viewport">
        {/* Radial gradient that follows cursor */}
        <div
          className="flashlight-mask"
          style={{
            background: `radial-gradient(circle 150px at ${mousePos.x}px ${mousePos.y}px, transparent 0%, black 100%)`
          }}
        />

        {/* Content that becomes visible in the light */}
        <div className="flashlight-content visible-content">
          {/* Header */}
          <header className="border-b border-gray-800 bg-black/50 backdrop-blur sticky top-0 z-10">
            <div className="container mx-auto px-4 py-4 flex items-center justify-between">
              <Link href="/" className="text-lg md:text-xl font-mono text-gray-400 hover:text-gray-300 transition-colors">
                a normal website
              </Link>
              <Link href="/archive">
                <Button variant="outline" className="font-mono border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-gray-200">
                  archive
                </Button>
              </Link>
            </div>
          </header>

          {/* Main Content */}
          <main className="container mx-auto px-4 py-8 md:py-16">
            <div className="max-w-4xl mx-auto space-y-8">
              {/* Title */}
              <div className="text-center space-y-4 mb-12">
                <h1 className="text-4xl md:text-6xl font-mono font-bold text-gray-300 tracking-tight">
                  CLASSIFIED
                </h1>
                <p className="text-lg md:text-xl text-gray-500 font-mono">
                  Research Division • Sector 7 • Level ███
                </p>
                <div className="text-sm text-red-500 font-mono mt-4">
                  ⚠ CLEARANCE LEVEL OMEGA REQUIRED ⚠
                </div>
              </div>

              {/* Experiments */}
              <div className="space-y-6">
                {experiments.map((exp) => (
                  <div
                    key={exp.number}
                    className="border border-gray-800 bg-gray-900/30 backdrop-blur rounded p-4 md:p-6"
                  >
                    <div className="flex items-start gap-4">
                      <div className="font-mono text-gray-500 text-sm min-w-[100px]">
                        ENTRY #{exp.number.toString().padStart(2, '0')}
                      </div>
                      <div className="flex-1">
                        <p className={`font-mono text-sm md:text-base leading-relaxed ${
                          exp.redacted ? 'text-gray-700' : 'text-gray-400'
                        }`}>
                          {exp.text}
                        </p>
                        {exp.number === 17 && (
                          <p className="text-xs text-gray-600 mt-2 font-mono">
                            [ENCRYPTION: WINGDINGS] [STATUS: ACTIVE]
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer warning */}
              <div className="text-center mt-16 space-y-2">
                <p className="text-xs text-gray-600 font-mono">
                  DOCUMENT CLASSIFICATION: TOP SECRET // COMPARTMENTALIZED
                </p>
                <p className="text-xs text-gray-700 font-mono">
                  UNAUTHORIZED ACCESS WILL BE PROSECUTED TO THE FULLEST EXTENT
                </p>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  )
}
