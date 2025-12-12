'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Scale, Shield, Clock, Gavel } from 'lucide-react'

export default function ShanidevPage() {
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAccess = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/signin')
        return
      }

      // Check fun value
      const { data: profile } = await supabase
        .from('profiles')
        .select('fun_value')
        .eq('id', user.id)
        .single()

      if (!profile || profile.fun_value !== 8) {
        // Redirect to 403 if fun value is not exactly 8
        router.push('/forbidden')
        return
      }

      // Track page discovery
      await supabase.rpc('record_page_discovery', {
        p_user_id: user.id,
        p_page_key: 'shanidev'
      })

      setLoading(false)
    }

    checkAccess()
  }, [router, supabase])

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-gray-400 font-mono">verifying access...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900/20 to-black text-gray-100">
      {/* Header */}
      <header className="border-b border-purple-500/30 bg-black/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="text-lg font-mono text-purple-300 hover:text-purple-200 transition-colors">
            ← return
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-4xl mx-auto">
          {/* Title Section */}
          <div className="text-center mb-16 space-y-4">
            <div className="inline-block p-6 rounded-full bg-purple-500/10 border-2 border-purple-500/30 mb-6">
              <div className="w-20 h-20 relative">
                <div className="absolute inset-0 bg-purple-500/20 rounded-full animate-pulse" />
                <div className="absolute inset-2 bg-purple-500/30 rounded-full" />
                <div className="absolute inset-4 bg-purple-500/40 rounded-full" />
                <div className="absolute inset-6 bg-purple-500/60 rounded-full" />
              </div>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold font-mono text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-200">
              SATURN
            </h1>
            <p className="text-xl md:text-2xl font-mono text-purple-300/80">
              lord of discipline • guardian of time
            </p>
          </div>

          {/* Four Pillars Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {/* Discipline */}
            <div className="bg-black/40 border border-purple-500/20 rounded-lg p-8 hover:border-purple-500/40 transition-all">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-purple-500/10 rounded-lg">
                  <Shield className="w-8 h-8 text-purple-400" />
                </div>
                <h2 className="text-2xl font-mono font-bold text-purple-300">discipline</h2>
              </div>
              <div className="space-y-3 font-mono text-sm text-gray-300 leading-relaxed">
                <p>
                  The path to mastery requires unwavering commitment. Saturn teaches us that true strength comes not from impulse, but from the steady application of will.
                </p>
                <p className="text-purple-400/80 italic">
                  "Self-control is the foundation upon which all achievement is built."
                </p>
              </div>
            </div>

            {/* Structure */}
            <div className="bg-black/40 border border-purple-500/20 rounded-lg p-8 hover:border-purple-500/40 transition-all">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-purple-500/10 rounded-lg">
                  <Scale className="w-8 h-8 text-purple-400" />
                </div>
                <h2 className="text-2xl font-mono font-bold text-purple-300">structure</h2>
              </div>
              <div className="space-y-3 font-mono text-sm text-gray-300 leading-relaxed">
                <p>
                  Order creates possibility. The rings of Saturn remind us that boundaries are not limitations—they are the framework that allows complexity to flourish.
                </p>
                <p className="text-purple-400/80 italic">
                  "In the architecture of constraints, we find the blueprint for greatness."
                </p>
              </div>
            </div>

            {/* Responsibility */}
            <div className="bg-black/40 border border-purple-500/20 rounded-lg p-8 hover:border-purple-500/40 transition-all">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-purple-500/10 rounded-lg">
                  <Clock className="w-8 h-8 text-purple-400" />
                </div>
                <h2 className="text-2xl font-mono font-bold text-purple-300">responsibility</h2>
              </div>
              <div className="space-y-3 font-mono text-sm text-gray-300 leading-relaxed">
                <p>
                  Every action casts a shadow into the future. Saturn holds us accountable not to external judgment, but to the weight of our own choices.
                </p>
                <p className="text-purple-400/80 italic">
                  "The burden we carry today becomes the strength we wield tomorrow."
                </p>
              </div>
            </div>

            {/* Justice */}
            <div className="bg-black/40 border border-purple-500/20 rounded-lg p-8 hover:border-purple-500/40 transition-all">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-purple-500/10 rounded-lg">
                  <Gavel className="w-8 h-8 text-purple-400" />
                </div>
                <h2 className="text-2xl font-mono font-bold text-purple-300">justice</h2>
              </div>
              <div className="space-y-3 font-mono text-sm text-gray-300 leading-relaxed">
                <p>
                  Karma is not punishment—it is equilibrium. Saturn's justice is the universe ensuring that every seed planted eventually bears its fruit.
                </p>
                <p className="text-purple-400/80 italic">
                  "What you sow in darkness will be harvested in light."
                </p>
              </div>
            </div>
          </div>

          {/* Saturn Facts */}
          <div className="bg-black/40 border border-purple-500/20 rounded-lg p-8 mb-12">
            <h2 className="text-2xl font-mono font-bold text-purple-300 mb-6">astronomical profile</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-sm">
              <div>
                <div className="text-purple-400/60 mb-1">orbital period</div>
                <div className="text-gray-200 text-lg">29.5 Earth years</div>
              </div>
              <div>
                <div className="text-purple-400/60 mb-1">ring system</div>
                <div className="text-gray-200 text-lg">7 major rings</div>
              </div>
              <div>
                <div className="text-purple-400/60 mb-1">moons</div>
                <div className="text-gray-200 text-lg">146 confirmed</div>
              </div>
              <div>
                <div className="text-purple-400/60 mb-1">density</div>
                <div className="text-gray-200 text-lg">0.687 g/cm³</div>
              </div>
              <div>
                <div className="text-purple-400/60 mb-1">composition</div>
                <div className="text-gray-200 text-lg">hydrogen + helium</div>
              </div>
              <div>
                <div className="text-purple-400/60 mb-1">fun value required</div>
                <div className="text-gray-200 text-lg">exactly 8</div>
              </div>
            </div>
          </div>

          {/* Closing Quote */}
          <div className="text-center">
            <div className="inline-block border-t border-b border-purple-500/30 py-6 px-8">
              <p className="font-mono text-purple-300/90 text-lg leading-relaxed max-w-2xl">
                "In the cold void of space, Saturn watches. Patient. Eternal. Reminding us that all things—great and small—must answer to the laws of time."
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
