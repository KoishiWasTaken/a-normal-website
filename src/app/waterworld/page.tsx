'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { recordPageDiscovery } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Waves, Droplet, AlertTriangle } from 'lucide-react'

export default function WaterWorldPage() {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [tracked, setTracked] = useState(false)
  const router = useRouter()
  const supabase = createClient()

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
      await recordPageDiscovery(supabase, user.id, 'waterworld')
        setTracked(true)
      }

      setLoading(false)
    }

    fetchData()
  }, [router, supabase, tracked])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-400 to-blue-600 flex items-center justify-center">
        <div className="text-white font-mono">loading...</div>
      </div>
    )
  }

  const attractions = [
    {
      name: "The Abyss Plunge",
      icon: "🌊",
      thrill: "EXTREME",
      description: "A vertical drop slide that plummets 47 stories straight down into a pool deeper than the Mariana Trench. Freefall speed: 127 mph. Warning: gravitational forces may cause temporary loss of consciousness.",
      stats: "Height: 1,847 ft • Speed: 127 mph • Drop time: 8.2 seconds"
    },
    {
      name: "Typhoon Centrifuge",
      icon: "🌀",
      thrill: "INSANE",
      description: "Experience forces equivalent to 12 Gs as you're spun through a massive water vortex at supersonic speeds. The attraction uses industrial-grade centrifuges normally reserved for astronaut training. Riders must sign a 47-page waiver.",
      stats: "G-Force: 12G • RPM: 850 • Diameter: 200 ft"
    },
    {
      name: "Niagara Cannon",
      icon: "💥",
      thrill: "EXTREME",
      description: "Get literally launched from a high-pressure water cannon across a 300-foot gap into a foam pit. Projectile physics have been carefully calculated to achieve maximum airtime. Helmets mandatory.",
      stats: "Launch speed: 95 mph • Distance: 312 ft • Max altitude: 89 ft"
    },
    {
      name: "Tsunami Simulator",
      icon: "🌊",
      thrill: "EXTREME",
      description: "A 150-foot artificial wave crashes over participants in a concrete bunker designed to withstand category 5 hurricanes. 2.5 million gallons of water released simultaneously. Recommended for experienced swimmers only.",
      stats: "Wave height: 150 ft • Water volume: 2.5M gallons • Impact force: Classified"
    },
    {
      name: "The Hydro-Accelerator",
      icon: "⚡",
      thrill: "INSANE",
      description: "A water slide that uses rocket boosters to accelerate riders beyond the speed of sound. The sonic boom can be heard from 3 miles away. Pressure suits provided. Medical staff on standby at all times.",
      stats: "Top speed: 768 mph • Length: 2.3 miles • Sonic boom: 170 dB"
    },
    {
      name: "Whirlpool Labyrinth",
      icon: "🔄",
      thrill: "EXTREME",
      description: "Navigate through a maze of interconnected whirlpools, each spinning at different velocities. Some whirlpools connect to underwater tunnels. GPS trackers provided to help locate lost swimmers.",
      stats: "Pool size: 4 acres • Whirlpools: 27 • Max depth: 80 ft"
    },
    {
      name: "Arctic Plunge",
      icon: "🧊",
      thrill: "EXTREME",
      description: "A slide that passes through a cryogenic chamber, instantly freezing the water around you into a solid ice tunnel. You'll break through the ice at 60 mph into a heated pool. Thermal shock guaranteed.",
      stats: "Freeze temp: -40°F • Ice thickness: 6 inches • Thaw pool: 105°F"
    },
    {
      name: "Pressure Chamber Rapids",
      icon: "💎",
      thrill: "INSANE",
      description: "Ride rapids through a pressurized tube that simulates ocean depths of 12,000 feet. The pressure is intense enough to compress carbon into diamonds. Decompression chamber required after exit.",
      stats: "Pressure: 5,500 PSI • Depth equivalent: 12,000 ft • Duration: 45 seconds"
    },
    {
      name: "Boiling Point",
      icon: "🔥",
      thrill: "EXTREME",
      description: "A series of pools with temperatures ranging from 32°F to 212°F. Riders sprint between pools before hypothermia or heat stroke sets in. World record: 8 pools in 47 seconds.",
      stats: "Pools: 12 • Temp range: 32°F - 212°F • Medical staff: 24/7"
    },
    {
      name: "The Maelstrom",
      icon: "💫",
      thrill: "INSANE",
      description: "A massive water tornado generated by 500 industrial fans creates a swirling vortex 200 feet tall. Riders are lifted by the updraft and spun at velocities that make vision impossible. Maximum ride time: 60 seconds to prevent permanent disorientation.",
      stats: "Height: 200 ft • Wind speed: 180 mph • Vortex diameter: 75 ft"
    },
    {
      name: "Submarine Speedway",
      icon: "🚀",
      thrill: "EXTREME",
      description: "Riders are sealed in hydrodynamic capsules and shot through underwater tubes at ridiculous speeds. The tubes pass through shark tanks, geothermal vents, and a brief segment that exits the park entirely.",
      stats: "Speed: 112 mph • Length: 3.7 miles • Sharks: 47"
    },
    {
      name: "Waterfall Rappel",
      icon: "⛰️",
      thrill: "EXTREME",
      description: "Climb up the inside of a 400-foot artificial waterfall while water crashes down at 50,000 gallons per minute. Slip and you'll fall into the Abyss Plunge's catch pool. Climbing gear included.",
      stats: "Height: 400 ft • Flow rate: 50,000 GPM • Completion rate: 12%"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-400 via-blue-500 to-blue-600">
      {/* Animated waves background */}
      <style jsx global>{`
        @keyframes wave {
          0%, 100% { transform: translateX(0) translateY(0); }
          50% { transform: translateX(-25px) translateY(10px); }
        }
        .wave-pattern {
          background-image:
            radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(255,255,255,0.1) 0%, transparent 50%);
          animation: wave 8s ease-in-out infinite;
        }
      `}</style>

      <div className="wave-pattern">
        {/* Header */}
        <header className="border-b-4 border-white/30 backdrop-blur-sm bg-white/10">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="text-lg md:text-xl font-mono text-white hover:text-blue-200 transition-colors font-bold">
              a normal website
            </Link>
            <Link href="/archive">
              <Button variant="outline" className="font-mono border-2 border-white text-white bg-transparent hover:bg-white hover:text-blue-600 font-bold">
                archive
              </Button>
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8 md:py-16">
          <div className="max-w-6xl mx-auto space-y-12">
            {/* Title */}
            <div className="text-center space-y-6">
              <div className="flex items-center justify-center gap-4">
                <Waves className="text-white animate-pulse" size={48} />
                <h1 className="text-5xl md:text-7xl font-bold text-white drop-shadow-2xl">
                  WATER WORLD
                </h1>
                <Waves className="text-white animate-pulse" size={48} style={{ animationDelay: '0.5s' }} />
              </div>
              <p className="text-xl md:text-2xl text-blue-100 font-bold">
                WHERE PHYSICS MEETS MADNESS
              </p>
              <div className="inline-block bg-yellow-400 text-black px-6 py-3 rounded-full font-bold text-lg animate-bounce">
                ⚠️ ENTER AT YOUR OWN RISK ⚠️
              </div>
            </div>

            {/* Welcome Message */}
            <Card className="border-4 border-blue-300 bg-white/95 backdrop-blur-lg shadow-2xl">
              <CardHeader className="text-center">
                <CardTitle className="text-3xl font-bold text-blue-900">Welcome to Water World!</CardTitle>
                <CardDescription className="text-lg text-blue-700 font-semibold">
                  The world's most extreme aquatic adventure park
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-center text-gray-700 leading-relaxed">
                  Experience thrills that defy the laws of physics, safety regulations, and common sense!
                  Our state-of-the-art attractions push the boundaries of what's possible with water, speed, and gravity.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <Droplet className="mx-auto mb-2 text-blue-600" size={32} />
                    <p className="font-bold text-blue-900">50M+ Gallons</p>
                    <p className="text-sm text-blue-700">Water Capacity</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <AlertTriangle className="mx-auto mb-2 text-yellow-600" size={32} />
                    <p className="font-bold text-blue-900">12 Attractions</p>
                    <p className="text-sm text-blue-700">EXTREME & INSANE</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <Waves className="mx-auto mb-2 text-cyan-600" size={32} />
                    <p className="font-bold text-blue-900">24/7 Medical</p>
                    <p className="text-sm text-blue-700">Staff on Site</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Attractions Grid */}
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-white text-center mb-8">OUR ATTRACTIONS</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {attractions.map((attraction, index) => (
                  <Card
                    key={index}
                    className="border-4 border-blue-300 bg-white/90 backdrop-blur-lg shadow-xl hover:shadow-2xl transition-all hover:scale-105"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-4xl">{attraction.icon}</span>
                          <div>
                            <CardTitle className="text-xl font-bold text-blue-900">
                              {attraction.name}
                            </CardTitle>
                            <div className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-bold ${
                              attraction.thrill === 'INSANE'
                                ? 'bg-red-500 text-white'
                                : 'bg-orange-500 text-white'
                            }`}>
                              {attraction.thrill}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {attraction.description}
                      </p>
                      <div className="pt-2 border-t border-blue-200">
                        <p className="text-xs font-mono text-blue-800">
                          {attraction.stats}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Safety Disclaimer */}
            <Card className="border-4 border-red-500 bg-red-50/95 backdrop-blur-lg">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-red-900 flex items-center gap-2">
                  <AlertTriangle size={32} />
                  Safety Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-red-800 font-semibold">
                  • All riders must sign comprehensive liability waivers
                </p>
                <p className="text-sm text-red-800 font-semibold">
                  • Medical examination required before INSANE-level attractions
                </p>
                <p className="text-sm text-red-800 font-semibold">
                  • Life insurance verification recommended
                </p>
                <p className="text-sm text-red-800 font-semibold">
                  • Emergency medical staff deployed throughout the park
                </p>
                <p className="text-sm text-red-800 font-semibold">
                  • Decompression chambers available at all major attractions
                </p>
                <p className="text-xs text-red-600 mt-4 italic">
                  Water World assumes no responsibility for temporal disorientation,
                  spontaneous aquatic transformations, or interdimensional displacement.
                </p>
              </CardContent>
            </Card>

            {/* Footer */}
            <div className="text-center text-white space-y-2 py-8">
              <p className="font-bold text-xl">WATER WORLD</p>
              <p className="text-sm text-blue-200">Location: [REDACTED] • Hours: 24/7 • Emergency Contact: 911</p>
              <p className="text-xs text-blue-300 italic">
                "Making waves since [DATA EXPUNGED]"
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
