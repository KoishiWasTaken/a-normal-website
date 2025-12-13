'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { recordPageDiscovery } from '@/lib/utils'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Zap } from 'lucide-react'

interface CelestialObject {
  ra: string
  dec: string
  label: string
  name: string | null
  locked: boolean
  hint: string | null
  destination: string | null
}

export default function RadarPage() {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [tracked, setTracked] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [hasDiscoveredInferno, setHasDiscoveredInferno] = useState(false)
  const [hasDiscoveredShanidev, setHasDiscoveredShanidev] = useState(false)
  const [hasDiscoveredDeepblue, setHasDiscoveredDeepblue] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const trackDiscovery = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)

      if (user && !tracked) {
      await recordPageDiscovery(supabase, user.id, 'radar')
        setTracked(true)

        // Check if user has discovered Celestial Inferno
        const { data: infernoDiscoveries } = await supabase
          .from('page_discoveries')
          .select('page_id, pages!inner(page_key)')
          .eq('user_id', user.id)
          .eq('pages.page_key', 'celestialinferno')

        if (infernoDiscoveries && infernoDiscoveries.length > 0) {
          setHasDiscoveredInferno(true)
        }

        // Check if user has discovered Shanidev (Lord Saturn)
        const { data: shanidevDiscoveries } = await supabase
          .from('page_discoveries')
          .select('page_id, pages!inner(page_key)')
          .eq('user_id', user.id)
          .eq('pages.page_key', 'shanidev')

        if (shanidevDiscoveries && shanidevDiscoveries.length > 0) {
          setHasDiscoveredShanidev(true)
        }

        // Check if user has discovered Deep Blue
        const { data: deepblueDiscoveries } = await supabase
          .from('page_discoveries')
          .select('page_id, pages!inner(page_key)')
          .eq('user_id', user.id)
          .eq('pages.page_key', 'deepblue')

        if (deepblueDiscoveries && deepblueDiscoveries.length > 0) {
          setHasDiscoveredDeepblue(true)
        }
      }
    }

    trackDiscovery()
  }, [supabase, tracked])

  // Celestial coordinates - Sun and 9 planets including Pluto
  const coordinates: CelestialObject[] = [
    { ra: '00h 00m 00s', dec: '+00° 00\' 00"', label: 'OBJECT-01', name: null, locked: true, hint: null, destination: null },
    { ra: '12h 47m 23s', dec: '-03° 41\' 18"', label: 'OBJECT-02', name: null, locked: true, hint: null, destination: null },
    {
      ra: '15h 23m 44s',
      dec: '-18° 28\' 35"',
      label: hasDiscoveredInferno ? 'Venus' : 'OBJECT-03',
      name: hasDiscoveredInferno ? 'Venus' : null,
      locked: !hasDiscoveredInferno,
      hint: hasDiscoveredInferno ? null : 'Available in the Library',
      destination: '/celestial/inferno'
    },
    { ra: '09h 14m 56s', dec: '+18° 44\' 23"', label: 'OBJECT-04', name: null, locked: true, hint: null, destination: null },
    { ra: '21h 33m 18s', dec: '-14° 22\' 47"', label: 'OBJECT-05', name: null, locked: true, hint: null, destination: null },
    {
      ra: '04h 38m 52s',
      dec: '+19° 52\' 11"',
      label: hasDiscoveredShanidev ? 'Saturn' : 'OBJECT-06',
      name: hasDiscoveredShanidev ? 'Saturn' : null,
      locked: !hasDiscoveredShanidev,
      hint: hasDiscoveredShanidev ? null : 'Warp at FV8',
      destination: '/celestial/shanidev'
    },
    { ra: '06h 51m 07s', dec: '+23° 14\' 33"', label: 'OBJECT-07', name: null, locked: true, hint: null, destination: null },
    {
      ra: '01h 18m 42s',
      dec: '+08° 17\' 54"',
      label: hasDiscoveredDeepblue ? 'Neptune' : 'OBJECT-08',
      name: hasDiscoveredDeepblue ? 'Neptune' : null,
      locked: !hasDiscoveredDeepblue,
      hint: hasDiscoveredDeepblue ? null : 'Your Party Invitation',
      destination: '/celestial/deepblue'
    },
    { ra: '23h 42m 29s', dec: '-05° 33\' 26"', label: 'OBJECT-09', name: null, locked: true, hint: null, destination: null },
    { ra: '19h 28m 15s', dec: '+22° 47\' 38"', label: 'OBJECT-10', name: null, locked: true, hint: null, destination: null },
  ]

  const selectedCoord = selectedIndex !== null ? coordinates[selectedIndex] : null
  const canBeam = selectedCoord && !selectedCoord.locked && selectedCoord.destination

  const handleBeam = () => {
    if (canBeam && selectedCoord.destination) {
      router.push(selectedCoord.destination)
    }
  }

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
                onClick={() => setSelectedIndex(index)}
                className={`cursor-pointer border-cyan-900/50 bg-gradient-to-br from-slate-950/90 to-purple-950/50 backdrop-blur hover:border-cyan-500/50 transition-all group ${
                  selectedIndex === index
                    ? 'border-cyan-400 ring-2 ring-cyan-400/50'
                    : ''
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <span className={`font-mono text-sm md:text-base font-bold ${
                      coord.locked ? 'text-cyan-400' : 'text-green-400'
                    }`}>
                      {coord.label}
                    </span>
                    <div className={`w-2 h-2 rounded-full transition-colors ${
                      selectedIndex === index
                        ? coord.locked ? 'bg-cyan-400' : 'bg-green-400 animate-pulse'
                        : 'bg-purple-400 group-hover:bg-cyan-400'
                    }`} />
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
                  <div className="pt-2 border-t border-cyan-900/30 space-y-1">
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />
                      <span className={coord.locked ? 'text-cyan-400/40' : 'text-green-400 font-bold'}>
                        {coord.locked ? 'LOCKED' : 'UNLOCKED'}
                      </span>
                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />
                    </div>
                    {coord.hint && (
                      <div className="text-center">
                        <span className="text-xs text-purple-400 font-mono font-bold">
                          {coord.hint}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Beam Control */}
          <div className="flex justify-center">
            <Button
              onClick={handleBeam}
              disabled={!canBeam}
              className={`font-mono text-lg px-8 py-6 transition-all duration-300 ${
                canBeam
                  ? 'bg-green-500 hover:bg-green-400 text-black shadow-lg shadow-green-500/50 animate-pulse'
                  : 'bg-cyan-900/30 text-cyan-400/40 cursor-not-allowed'
              }`}
            >
              <Zap className={`mr-2 ${canBeam ? 'animate-pulse' : ''}`} />
              Beam to Destination
            </Button>
          </div>

          {/* Selection Info */}
          {selectedCoord && (
            <Card className="border-cyan-500/30 bg-cyan-950/20 backdrop-blur">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      canBeam ? 'bg-green-400 animate-pulse' : 'bg-cyan-400'
                    }`} />
                    <p className="text-sm font-mono text-cyan-300">
                      {canBeam ? 'TARGET LOCKED' : 'TARGET SELECTED'}
                    </p>
                  </div>
                  <p className="text-xs md:text-sm font-mono text-cyan-200/70 leading-relaxed">
                    {canBeam
                      ? `destination accessible: ${selectedCoord.label}. beam transportation ready.`
                      : selectedCoord.locked
                      ? `${selectedCoord.label} coordinates locked. access denied.${selectedCoord.hint ? ` hint: ${selectedCoord.hint.toLowerCase()}.` : ''}`
                      : 'select an unlocked destination to initiate beam transport.'
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

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
                <p className="text-xs md:text-sm font-mono text-purple-200/70 leading-relaxed">
                  select a coordinate to prepare beam transport. unlocked destinations allow direct navigation.
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
