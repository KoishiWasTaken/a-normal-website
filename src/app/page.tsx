'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Track page discovery
    const trackDiscovery = async () => {
      console.log('🔍 Checking authentication...')
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      console.log('👤 User:', user ? `Logged in as ${user.email}` : 'Not logged in')
      if (userError) console.error('❌ Auth error:', userError)

      setUser(user)
      setLoading(false)

      if (user) {
        console.log('📊 Attempting to track homepage discovery...')
        // Record homepage discovery
        const { data, error } = await supabase.rpc('record_page_discovery', {
          p_user_id: user.id,
          p_page_key: 'homepage'
        })

        if (error) {
          console.error('❌ Discovery tracking error:', error)
        } else if (data?.success) {
          console.log('✅ Page discovered!', data)
        } else {
          console.log('ℹ️ Discovery result:', data)
        }
      }
    }

    trackDiscovery()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground font-mono">loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-mono text-foreground hover:text-primary transition-colors">
            a normal website
          </Link>

          <nav className="flex items-center gap-4">
            {user ? (
              <>
                <Link href="/collection">
                  <Button variant="ghost" className="font-mono">
                    collection
                  </Button>
                </Link>
                <Link href="/leaderboard">
                  <Button variant="ghost" className="font-mono">
                    leaderboard
                  </Button>
                </Link>
                <Link href="/profile">
                  <Button variant="ghost" className="font-mono">
                    profile
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/auth/signin">
                  <Button variant="ghost" className="font-mono">
                    sign in
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button variant="default" className="font-mono">
                    sign up
                  </Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-5xl font-mono font-bold text-foreground tracking-tight">
              welcome
            </h1>
            <p className="text-xl text-muted-foreground font-mono">
              to a completely normal website
            </p>
          </div>

          <div className="border border-border bg-card rounded-lg p-8 space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-mono text-card-foreground">
                nothing unusual here
              </h2>
              <p className="text-muted-foreground font-mono leading-relaxed">
                this is just a regular website. you can browse around if you want.
                there&apos;s really nothing special to find.
              </p>
            </div>

            {!user && (
              <div className="pt-4 border-t border-border space-y-4">
                <p className="text-sm text-muted-foreground font-mono">
                  if you want to keep track of your... browsing history, you can create an account.
                  totally optional though.
                </p>
                <div className="flex gap-3">
                  <Link href="/auth/signup">
                    <Button className="font-mono">
                      create account
                    </Button>
                  </Link>
                  <Link href="/auth/signin">
                    <Button variant="outline" className="font-mono">
                      sign in
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {user && (
              <div className="pt-4 border-t border-border space-y-4">
                <p className="text-sm text-primary font-mono">
                  welcome back. your discoveries are being tracked.
                </p>
                <div className="flex gap-3">
                  <Link href="/collection">
                    <Button className="font-mono">
                      view your collection
                    </Button>
                  </Link>
                  <Link href="/leaderboard">
                    <Button variant="outline" className="font-mono">
                      view leaderboard
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className="text-center">
            <p className="text-sm text-muted-foreground font-mono">
              © 2025 a normal website. all rights reserved. probably.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
