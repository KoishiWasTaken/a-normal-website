'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import MobileNav from '@/components/MobileNav'

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
      <header className="border-b border-border sticky top-0 bg-background z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-lg md:text-xl font-mono text-foreground hover:text-primary transition-colors">
            a normal website
          </Link>

          <MobileNav user={user} />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 md:py-16">
        <div className="max-w-3xl mx-auto space-y-6 md:space-y-8">
          <div className="text-center space-y-3 md:space-y-4">
            <h1 className="text-3xl md:text-5xl font-mono font-bold text-foreground tracking-tight">
              welcome
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground font-mono">
              to a completely normal website
            </p>
          </div>

          <div className="border border-border bg-card rounded-lg p-4 md:p-8 space-y-4 md:space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl md:text-2xl font-mono text-card-foreground">
                nothing unusual here
              </h2>
              <p className="text-sm md:text-base text-muted-foreground font-mono leading-relaxed">
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
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href="/auth/signup" className="w-full sm:w-auto">
                    <Button className="font-mono w-full">
                      create account
                    </Button>
                  </Link>
                  <Link href="/auth/signin" className="w-full sm:w-auto">
                    <Button variant="outline" className="font-mono w-full">
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
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href="/archive" className="w-full sm:w-auto">
                    <Button className="font-mono w-full">
                      view archive
                    </Button>
                  </Link>
                  <Link href="/leaderboard" className="w-full sm:w-auto">
                    <Button variant="outline" className="font-mono w-full">
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
