'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Lock } from 'lucide-react'

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
          <Link href="/" className="flex items-center gap-3">
            <span className="text-lg md:text-xl font-mono text-blue-400 hover:text-blue-300 transition-colors">
              a normal website
            </span>
          </Link>

          <nav className="flex items-center gap-4">
            <Link href="/archive">
              <Button variant="ghost" className="font-mono text-blue-400 hover:text-blue-300 hover:bg-blue-950/50">
                archive
              </Button>
            </Link>
            <Link href="/">
              <Button variant="ghost" className="font-mono text-blue-400 hover:text-blue-300 hover:bg-blue-950/50">
                home
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 md:py-16">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Welcome Section */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-mono font-bold text-blue-400">
              the vault
            </h1>
            <p className="text-lg md:text-xl text-blue-300/70 font-mono">
              a hidden collection
            </p>
          </div>

          {/* Main Info Card */}
          <Card className="border-blue-900/50 bg-slate-900/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="font-mono text-blue-400">you found it</CardTitle>
              <CardDescription className="font-mono text-blue-300/60">
                nice work spotting that button
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <p className="text-sm md:text-base text-blue-100 font-mono leading-relaxed">
                  this is the vault - a collection of things that didn't quite fit anywhere else
                  on the site. some pages are hidden deeper than others.
                </p>
                <p className="text-sm md:text-base text-blue-200/80 font-mono leading-relaxed">
                  there are more pages to discover. some are linked from here.
                  others... you'll have to find on your own.
                </p>
                <p className="text-xs md:text-sm text-blue-300/50 font-mono italic">
                  keep exploring. there's more to this website than what's on the surface.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Secret Pages Grid */}
          <div className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-mono font-bold text-blue-400">
              hidden pages
            </h2>
            <p className="text-sm text-blue-300/60 font-mono">
              0 / ??? unlocked
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Placeholder for future secret pages */}
              <Card className="border-dashed border-blue-900/30 bg-slate-900/20">
                <CardContent className="py-12 text-center">
                  <Lock size={32} className="mx-auto mb-3 text-blue-400/30" />
                  <p className="text-sm text-blue-300/40 font-mono">
                    ???
                  </p>
                  <p className="text-xs text-blue-400/20 font-mono mt-2">
                    not discovered yet
                  </p>
                </CardContent>
              </Card>

              <Card className="border-dashed border-blue-900/30 bg-slate-900/20">
                <CardContent className="py-12 text-center">
                  <Lock size={32} className="mx-auto mb-3 text-blue-400/30" />
                  <p className="text-sm text-blue-300/40 font-mono">
                    ???
                  </p>
                  <p className="text-xs text-blue-400/20 font-mono mt-2">
                    not discovered yet
                  </p>
                </CardContent>
              </Card>

              <Card className="border-dashed border-blue-900/30 bg-slate-900/20">
                <CardContent className="py-12 text-center">
                  <Lock size={32} className="mx-auto mb-3 text-blue-400/30" />
                  <p className="text-sm text-blue-300/40 font-mono">
                    ???
                  </p>
                  <p className="text-xs text-blue-400/20 font-mono mt-2">
                    not discovered yet
                  </p>
                </CardContent>
              </Card>

              <Card className="border-dashed border-blue-900/30 bg-slate-900/20">
                <CardContent className="py-12 text-center">
                  <Lock size={32} className="mx-auto mb-3 text-blue-400/30" />
                  <p className="text-sm text-blue-300/40 font-mono">
                    ???
                  </p>
                  <p className="text-xs text-blue-400/20 font-mono mt-2">
                    not discovered yet
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Hint Card */}
          <Card className="border-blue-500/30 bg-blue-950/20">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <p className="text-sm font-mono text-blue-300">
                  hint:
                </p>
                <p className="text-xs md:text-sm font-mono text-blue-200/70 leading-relaxed">
                  hidden pages can be anywhere. sometimes they're linked. sometimes you need to
                  look at the source. sometimes you need to guess the right URL. good luck.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-blue-900/20 mt-16">
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-xs text-blue-400/30 font-mono">
            © 2025 a normal website. all rights reserved. probably.
          </p>
        </div>
      </footer>
    </div>
  )
}
