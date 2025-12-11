'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Lock, ExternalLink, Key, Database } from 'lucide-react'

export default function VaultPage() {
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

      if (!tracked) {
        // Track page discovery
        await supabase.rpc('record_page_discovery', {
          p_user_id: user.id,
          p_page_key: 'vault'
        })
        setTracked(true)
      }

      setLoading(false)
    }

    fetchData()
  }, [router, supabase, tracked])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-blue-400 font-mono">initializing...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="border-b border-blue-900/30 bg-slate-950/80 backdrop-blur sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Database className="w-5 h-5 md:w-6 md:h-6 text-blue-400" />
            <span className="text-lg md:text-xl font-mono text-blue-400">
              the vault
            </span>
          </div>

          <Link href="/">
            <Button variant="ghost" className="font-mono text-blue-400 hover:text-blue-300 hover:bg-blue-950/50">
              exit
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 md:py-16">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Welcome Section */}
          <div className="text-center space-y-4">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-blue-950 border-2 border-blue-500 flex items-center justify-center">
                <Key className="w-8 h-8 md:w-10 md:h-10 text-blue-400" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-mono font-bold text-blue-400">
              welcome to the vault
            </h1>
            <p className="text-lg md:text-xl text-blue-300/70 font-mono">
              you found something you weren't supposed to
            </p>
          </div>

          {/* Main Info Card */}
          <Card className="border-blue-900/50 bg-slate-900/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="font-mono text-blue-400">access granted</CardTitle>
              <CardDescription className="font-mono text-blue-300/60">
                this is a restricted area. proceed with caution.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <p className="text-sm md:text-base text-blue-100 font-mono leading-relaxed">
                  congratulations. you've discovered the vault - a hidden collection of
                  secrets that exist outside the normal structure of this website.
                </p>
                <p className="text-sm md:text-base text-blue-200/80 font-mono leading-relaxed">
                  this hub will eventually connect to other hidden pages, each containing
                  fragments of information that don't quite fit the "normal" narrative.
                </p>
                <p className="text-xs md:text-sm text-blue-300/50 font-mono italic">
                  the deeper you go, the less normal things become...
                </p>
              </div>

              <div className="pt-4 border-t border-blue-900/30">
                <div className="flex items-center gap-2 text-xs text-blue-400/60 font-mono">
                  <Lock size={14} />
                  <span>clearance level: basic</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Secret Pages Grid */}
          <div className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-mono font-bold text-blue-400">
              connected nodes
            </h2>
            <p className="text-sm text-blue-300/60 font-mono">
              discovered: 0 / ???
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Placeholder for future secret pages */}
              <Card className="border-dashed border-blue-900/30 bg-slate-900/20">
                <CardContent className="py-12 text-center">
                  <Lock size={32} className="mx-auto mb-3 text-blue-400/30" />
                  <p className="text-sm text-blue-300/40 font-mono">
                    node 01: locked
                  </p>
                  <p className="text-xs text-blue-400/20 font-mono mt-2">
                    find the key to unlock
                  </p>
                </CardContent>
              </Card>

              <Card className="border-dashed border-blue-900/30 bg-slate-900/20">
                <CardContent className="py-12 text-center">
                  <Lock size={32} className="mx-auto mb-3 text-blue-400/30" />
                  <p className="text-sm text-blue-300/40 font-mono">
                    node 02: locked
                  </p>
                  <p className="text-xs text-blue-400/20 font-mono mt-2">
                    find the key to unlock
                  </p>
                </CardContent>
              </Card>

              <Card className="border-dashed border-blue-900/30 bg-slate-900/20">
                <CardContent className="py-12 text-center">
                  <Lock size={32} className="mx-auto mb-3 text-blue-400/30" />
                  <p className="text-sm text-blue-300/40 font-mono">
                    node 03: locked
                  </p>
                  <p className="text-xs text-blue-400/20 font-mono mt-2">
                    find the key to unlock
                  </p>
                </CardContent>
              </Card>

              <Card className="border-dashed border-blue-900/30 bg-slate-900/20">
                <CardContent className="py-12 text-center">
                  <Lock size={32} className="mx-auto mb-3 text-blue-400/30" />
                  <p className="text-sm text-blue-300/40 font-mono">
                    node 04: locked
                  </p>
                  <p className="text-xs text-blue-400/20 font-mono mt-2">
                    find the key to unlock
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Warning Footer */}
          <Card className="border-blue-500/30 bg-blue-950/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="text-blue-400 mt-1">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="space-y-1 flex-1">
                  <p className="text-sm font-mono text-blue-300 font-bold">
                    system notice
                  </p>
                  <p className="text-xs md:text-sm font-mono text-blue-200/70 leading-relaxed">
                    this area is not indexed. navigation may be unpredictable.
                    remember how you got here - there's no guarantee you'll find your way back.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Return to Normal */}
          <div className="text-center pt-8">
            <Link href="/">
              <Button variant="outline" className="font-mono border-blue-400/30 text-blue-400 hover:bg-blue-950/50 hover:text-blue-300">
                return to normal site
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Ambient Footer */}
      <footer className="border-t border-blue-900/20 mt-16">
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-xs text-blue-400/30 font-mono">
            vault://restricted_access_zone
          </p>
        </div>
      </footer>
    </div>
  )
}
