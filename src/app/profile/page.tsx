'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface UserStats {
  total_pages_discovered: number
  last_discovery_at: string | null
  first_discoveries_count: number
}

export default function ProfilePage() {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
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

      // Fetch user statistics
      const { data: statsData } = await supabase
        .from('user_statistics')
        .select('total_pages_discovered, last_discovery_at, first_discoveries')
        .eq('user_id', user.id)
        .single()

      if (statsData) {
        const firstDiscoveries = Array.isArray(statsData.first_discoveries)
          ? statsData.first_discoveries.length
          : 0

        setStats({
          total_pages_discovered: statsData.total_pages_discovered,
          last_discovery_at: statsData.last_discovery_at,
          first_discoveries_count: firstDiscoveries
        })
      }

      setLoading(false)
    }

    fetchData()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'never'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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
            <Link href="/discoveries">
              <Button variant="ghost" className="font-mono">
                index
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
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-mono font-bold text-foreground">
              profile
            </h1>
            <p className="text-muted-foreground font-mono">
              your account information
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12 text-muted-foreground font-mono">
              loading...
            </div>
          ) : (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="font-mono">account details</CardTitle>
                  <CardDescription className="font-mono">
                    your basic information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-sm text-muted-foreground font-mono">email</div>
                    <div className="text-foreground font-mono">{user?.email}</div>
                  </div>

                  <div>
                    <div className="text-sm text-muted-foreground font-mono">user id</div>
                    <div className="text-xs text-foreground font-mono break-all">{user?.id}</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="font-mono">discovery statistics</CardTitle>
                  <CardDescription className="font-mono">
                    your exploration progress
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground font-mono">pages discovered</div>
                      <div className="text-3xl font-bold text-primary font-mono">
                        {stats?.total_pages_discovered || 0}
                      </div>
                    </div>

                    <div>
                      <div className="text-sm text-muted-foreground font-mono">first discoveries</div>
                      <div className="text-3xl font-bold text-primary font-mono">
                        {stats?.first_discoveries_count || 0}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-muted-foreground font-mono">last discovery</div>
                    <div className="text-foreground font-mono">{formatDate(stats?.last_discovery_at || null)}</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="font-mono">actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    variant="outline"
                    onClick={handleSignOut}
                    className="w-full font-mono"
                  >
                    sign out
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
