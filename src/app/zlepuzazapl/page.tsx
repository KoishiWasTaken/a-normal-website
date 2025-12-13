'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { recordPageDiscovery } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertTriangle, Lock, Skull } from 'lucide-react'

export default function UnnerfedPuzzlePlazaPage() {
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
        await recordPageDiscovery(supabase, user.id, 'zlepuzazapl')
        setTracked(true)
      }

      setLoading(false)
    }

    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, supabase, tracked])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-600 via-orange-500 to-pink-600 flex items-center justify-center">
        <div className="text-white font-mono text-xl animate-pulse">initializing unnerfed mode...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-600 via-orange-500 to-pink-600 animate-gradient-intense">
      <style jsx global>{`
        @keyframes gradient-intense {
          0% { background-position: 0% 50%; }
          25% { background-position: 100% 50%; }
          50% { background-position: 100% 100%; }
          75% { background-position: 0% 100%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-intense {
          background-size: 400% 400%;
          animation: gradient-intense 8s ease infinite;
        }
        @keyframes glitch {
          0%, 100% { transform: translate(0); }
          20% { transform: translate(-2px, 2px); }
          40% { transform: translate(2px, -2px); }
          60% { transform: translate(-2px, -2px); }
          80% { transform: translate(2px, 2px); }
        }
        .glitch-text {
          animation: glitch 0.3s infinite;
        }
      `}</style>

      {/* Header */}
      <header className="border-b-4 border-white/70 backdrop-blur-sm bg-black/30">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-lg md:text-xl font-mono text-white hover:text-red-200 transition-colors font-bold">
            a normal website
          </Link>
          <Link href="/archive">
            <Button variant="outline" className="font-mono border-2 border-white text-white bg-transparent hover:bg-white hover:text-red-600 font-bold">
              archive
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 md:py-16">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Title */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <Skull className="text-white animate-pulse" size={40} />
              <h1 className="text-4xl md:text-6xl font-mono font-black text-white drop-shadow-lg glitch-text">
                PUZZLE PLAZA
              </h1>
              <Skull className="text-white animate-pulse" size={40} style={{ animationDelay: '0.2s' }} />
            </div>
            <p className="text-lg md:text-xl text-white/90 font-mono font-bold glitch-text">
              [UNNERFED MODE]
            </p>
            <div className="text-sm text-white/70 font-mono">
              ⚠️ EXTREME DIFFICULTY - NO HINTS - NO MERCY ⚠️
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="error" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-black/50 backdrop-blur-md border-2 border-red-500 p-1">
              <TabsTrigger value="error" className="font-mono font-bold data-[state=active]:bg-red-600 data-[state=active]:text-white text-white/70">
                <AlertTriangle className="mr-2" size={16} />
                ERROR
              </TabsTrigger>
              <TabsTrigger value="unavailable1" disabled className="font-mono font-bold opacity-30 text-white/50">
                <Lock className="mr-2" size={16} />
                ???
              </TabsTrigger>
              <TabsTrigger value="unavailable2" disabled className="font-mono font-bold opacity-30 text-white/50">
                <Lock className="mr-2" size={16} />
                ???
              </TabsTrigger>
              <TabsTrigger value="unavailable3" disabled className="font-mono font-bold opacity-30 text-white/50">
                <Lock className="mr-2" size={16} />
                ???
              </TabsTrigger>
            </TabsList>

            {/* ERROR Tab */}
            <TabsContent value="error" className="mt-6">
              <Card className="border-4 border-red-600 bg-black/80 backdrop-blur-lg shadow-2xl">
                <CardHeader>
                  <CardTitle className="font-mono text-2xl text-red-500 flex items-center gap-2">
                    <AlertTriangle className="text-red-500 animate-pulse" />
                    ERROR: CORRUPTED DATA
                  </CardTitle>
                  <CardDescription className="font-mono text-red-300 font-semibold">
                    Puzzle data corrupted. Recovery in progress...
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col items-center gap-4">
                    {/* Empty Grid */}
                    <div className="inline-grid gap-2 p-4 bg-gradient-to-br from-red-950/80 to-black/80 rounded-lg border-4 border-red-600">
                      {Array(5).fill(null).map((_, i) => (
                        <div key={i} className="flex gap-2">
                          {Array(5).fill(null).map((_, j) => (
                            <div
                              key={`${i}-${j}`}
                              className="w-12 h-12 md:w-16 md:h-16 rounded-lg border-4 border-red-900/50 bg-black/50"
                            />
                          ))}
                        </div>
                      ))}
                    </div>
                    <p className="text-sm font-mono text-red-400">
                      Grid Size: 5x5 | Status: CORRUPTED
                    </p>
                  </div>

                  {/* Disabled Advance button */}
                  <div className="text-center pt-4 border-t border-red-800">
                    <Button
                      disabled
                      className="font-mono text-lg bg-gradient-to-r from-gray-700 to-gray-800 text-gray-500 font-bold py-6 px-8 shadow-xl opacity-50 cursor-not-allowed"
                    >
                      🔒 Advance (LOCKED)
                    </Button>
                    <p className="text-xs font-mono text-red-400 mt-2">
                      ⚠️ Data recovery required before proceeding
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Unavailable Tabs */}
            <TabsContent value="unavailable1">
              <Card className="border-4 border-gray-700 bg-black/80 backdrop-blur-lg">
                <CardContent className="py-12 text-center">
                  <Lock className="mx-auto mb-4 text-gray-600" size={64} />
                  <p className="text-xl font-mono text-gray-500">
                    LOCKED
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="unavailable2">
              <Card className="border-4 border-gray-700 bg-black/80 backdrop-blur-lg">
                <CardContent className="py-12 text-center">
                  <Lock className="mx-auto mb-4 text-gray-600" size={64} />
                  <p className="text-xl font-mono text-gray-500">
                    LOCKED
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="unavailable3">
              <Card className="border-4 border-gray-700 bg-black/80 backdrop-blur-lg">
                <CardContent className="py-12 text-center">
                  <Lock className="mx-auto mb-4 text-gray-600" size={64} />
                  <p className="text-xl font-mono text-gray-500">
                    LOCKED
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Warning Notice */}
          <Card className="border-2 border-orange-600 bg-black/60 backdrop-blur-lg">
            <CardContent className="pt-6">
              <div className="space-y-3 text-center">
                <div className="flex items-center justify-center gap-2">
                  <Skull className="text-orange-500 animate-pulse" size={24} />
                  <p className="text-sm font-mono text-orange-400 font-bold">
                    UNNERFED MODE ACTIVE
                  </p>
                  <Skull className="text-orange-500 animate-pulse" size={24} />
                </div>
                <p className="text-xs md:text-sm font-mono text-orange-300/90 leading-relaxed">
                  Welcome to the true Puzzle Plaza. These are the original puzzles at their intended difficulty - no hand-holding, no tutorials, no second chances. Solve at your own risk.
                </p>
                <p className="text-xs font-mono text-red-400/70 italic">
                  "It is said that only the most determined puzzle solvers have ever seen what lies beyond..."
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
