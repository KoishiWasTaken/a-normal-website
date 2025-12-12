'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function RadarPage() {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [tracked, setTracked] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const trackDiscovery = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)

      if (user && !tracked) {
        await supabase.rpc('record_page_discovery', {
          p_user_id: user.id,
          p_page_key: 'radar'
        })
        setTracked(true)
      }
    }

    trackDiscovery()
  }, [supabase, tracked])

  // Celestial coordinates - Sun and 9 planets including Pluto
  const coordinates = [
    { ra: '00h 00m 00s', dec: '+00° 00\' 00"', label: 'OBJECT-01', status: 'LOCKED' },
    { ra: '12h 47m 23s', dec: '-03° 41\' 18"', label: 'OBJECT-02', status: 'LOCKED' },
    { ra: '15h 23m 44s', dec: '-18° 28\' 35"', label: 'OBJECT-03', status: 'AVAILABLE IN LIBRARY' }, // Venus
    { ra: '09h 14m 56s', dec: '+18° 44\' 23"', label: 'OBJECT-04', status: 'LOCKED' },
    { ra: '21h 33m 18s', dec: '-14° 22\' 47"', label: 'OBJECT-05', status: 'LOCKED' },
    { ra: '04h 38m 52s', dec: '+19° 52\' 11"', label: 'OBJECT-06', status: 'LOCKED' },
    { ra: '06h 51m 07s', dec: '+23° 14\' 33"', label: 'OBJECT-07', status: 'LOCKED' },
    { ra: '01h 18m 42s', dec: '+08° 17\' 54"', label: 'OBJECT-08', status: 'LOCKED' },
    { ra: '23h 42m 29s', dec: '-05° 33\' 26"', label: 'OBJECT-09', status: 'LOCKED' },
    { ra: '19h 28m 15s', dec: '+22° 47\' 38"', label: 'OBJECT-10', status: 'LOCKED' },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-cyan-400 font-mono">initializing deep space scan...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Starfield */}
      <div className="absolute inset-0 opacity-50">
        <div className="absolute w-1 h-1 bg-white rounded-full top-[10%] left-[15%] animate-pulse" />
        <div className="absolute w-1 h-1 bg-white rounded-full top-[20%] left-[80%]" />
        <div className="absolute w-0.5 h-0.5 bg-cyan-300 rounded-full top-[30%] left-[25%] animate-pulse" />
        <div className="absolute w-1 h-1 bg-white rounded-full top-[40%] left-[70%]" />
        <div className="absolute w-0.5 h-0.5 bg-purple-300 rounded-full top-[50%] left-[45%] animate-pulse" />
        <div className="absolute w-1 h-1 bg-white rounded-full top-[60%] left-[90%]" />
        <div className="absolute w-0.5 h-0.5 bg-cyan-300 rounded-full top-[70%] left-[35%]" />
        <div className="absolute w-1 h-1 bg-white rounded-full top-[80%] left-[60%] animate-pulse" />
        <div className="absolute w-0.5 h-0.5 bg-white rounded-full top-[15%] left-[50%]" />
        <div className="absolute w-1 h-1 bg-purple-300 rounded-full top-[85%] left-[20%]" />
      </div>

      {/* Header */}
      <header className="border-b border-cyan-900/30 bg-black/80 backdrop-blur sticky top-0 z-40 relative">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-lg md:text-xl font-mono text-cyan-400 hover:text-cyan-300 transition-colors">
            a normal website
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/archive">
              <Button variant="ghost" className="font-mono text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/50">
                archive
              </Button>
            </Link>
            <Link href="/">
              <Button variant="ghost" className="font-mono text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/50">
                home
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Main */}
      <main className="container mx-auto px-4 py-8 md:py-16 relative">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Title */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-6xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-cyan-400 animate-pulse">
              DEEP SPACE RADAR
            </h1>
            <p className="text-lg md:text-xl text-cyan-300/70 font-mono">
              scanning celestial objects
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-cyan-400/50 font-mono">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
              <span>signal active</span>
            </div>
          </div>

          {/* Coordinates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {coordinates.map((coord, index) => (
              <Card
                key={index}
                className="border-cyan-900/50 bg-gradient-to-br from-slate-950/90 to-purple-950/50 backdrop-blur hover:border-cyan-500/50 transition-all group"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-cyan-400 font-mono text-sm md:text-base font-bold">
                      {coord.label}
                    </span>
                    <div className="w-2 h-2 bg-purple-400 rounded-full group-hover:bg-cyan-400 transition-colors" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-cyan-300/60 font-mono">RA:</span>
                      <span className="text-cyan-100 font-mono text-sm md:text-base">{coord.ra}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-cyan-300/60 font-mono">DEC:</span>
                      <span className="text-cyan-100 font-mono text-sm md:text-base">{coord.dec}</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-cyan-900/30">
                    <div className="flex items-center gap-2 text-xs text-cyan-400/40 font-mono">
                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />
                      <span className={coord.status === 'AVAILABLE IN LIBRARY' ? 'text-purple-400 font-bold' : ''}>
                        {coord.status}
                      </span>
                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Info Card */}
          <Card className="border-purple-500/30 bg-purple-950/20 backdrop-blur">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse" />
                  <p className="text-sm font-mono text-purple-300">
                    TRANSMISSION RECEIVED
                  </p>
                </div>
                <p className="text-xs md:text-sm font-mono text-purple-200/70 leading-relaxed">
                  coordinates logged. celestial objects detected within scanning range.
                  classification: unknown. origin: classified. purpose: under investigation.
                </p>
                <div className="pt-2 text-xs font-mono text-purple-400/50">
                  [coordinates are presented in right ascension / declination format]
                </div>
              </div>
            </CardContent>
          </Card>


        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-cyan-900/20 mt-16 relative">
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-xs text-cyan-400/30 font-mono">
            deep_space_radar://transmission_active
          </p>
        </div>
      </footer>
    </div>
  )
}
