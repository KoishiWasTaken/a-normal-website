'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export default function InvertigoPage() {
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
        // Track page discovery
        await supabase.rpc('record_page_discovery', {
          p_user_id: user.id,
          p_page_key: 'invertigo'
        })
        setTracked(true)
      }
    }

    trackDiscovery()
  }, [supabase, tracked])

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-pink-600 font-mono">loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-pink-200 sticky top-0 bg-white z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button className="text-lg md:text-xl font-mono text-pink-600 cursor-default">
            a normal website
          </button>

          <nav className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <Button variant="ghost" className="font-mono text-pink-600 hover:text-pink-700 hover:bg-pink-50 cursor-default">
                  archive
                </Button>
                <Button variant="ghost" className="font-mono text-pink-600 hover:text-pink-700 hover:bg-pink-50 cursor-default">
                  leaderboard
                </Button>
                <Button variant="ghost" className="font-mono text-pink-600 hover:text-pink-700 hover:bg-pink-50 cursor-default">
                  profile
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" className="font-mono text-pink-600 hover:text-pink-700 hover:bg-pink-50 cursor-default">
                  sign in
                </Button>
                <Button className="font-mono bg-pink-600 hover:bg-pink-700 text-white cursor-default">
                  sign up
                </Button>
              </>
            )}
          </nav>

          {/* Mobile menu button (non-functional) */}
          <div className="md:hidden">
            <Button variant="ghost" size="sm" className="font-mono text-pink-600 cursor-default">
              ☰
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 md:py-16">
        <div className="max-w-3xl mx-auto space-y-6 md:space-y-8">
          <div className="text-center space-y-3 md:space-y-4">
            <h1 className="text-3xl md:text-5xl font-mono font-bold text-pink-600 tracking-tight">
              welcome
            </h1>
            <p className="text-lg md:text-xl text-pink-400 font-mono">
              to a completely normal website
            </p>
          </div>

          <div className="border border-pink-200 bg-pink-50 rounded-lg p-4 md:p-8 space-y-4 md:space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl md:text-2xl font-mono text-pink-600">
                nothing unusual here
              </h2>
              <p className="text-sm md:text-base text-pink-500 font-mono leading-relaxed">
                this is just a regular website. you can browse around if you want.
                there's really nothing special to find.
              </p>
            </div>

            {!user && (
              <div className="pt-4 border-t border-pink-200 space-y-4">
                <p className="text-sm text-pink-500 font-mono">
                  if you want to keep track of your... browsing history, you can create an account.
                  totally optional though.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button className="font-mono w-full bg-pink-600 hover:bg-pink-700 text-white cursor-default">
                    create account
                  </Button>
                  <Button variant="outline" className="font-mono w-full border-pink-300 text-pink-600 hover:bg-pink-50 cursor-default">
                    sign in
                  </Button>
                </div>
              </div>
            )}

            {user && (
              <div className="pt-4 border-t border-pink-200 space-y-4">
                <p className="text-sm text-pink-600 font-mono">
                  welcome back. your discoveries are being tracked.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button className="font-mono w-full bg-pink-600 hover:bg-pink-700 text-white cursor-default">
                    view archive
                  </Button>
                  <Button variant="outline" className="font-mono w-full border-pink-300 text-pink-600 hover:bg-pink-50 cursor-default">
                    view leaderboard
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="text-center space-y-8">
            {/* Hidden button area (inverted - no button visible here) */}
            <div className="flex justify-center">
              <div className="w-3 h-3" />
            </div>

            <p className="text-sm text-pink-400 font-mono">
              © 2025 a normal website. all rights reserved. probably.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
