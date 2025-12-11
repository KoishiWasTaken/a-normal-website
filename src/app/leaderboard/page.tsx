'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface LeaderboardEntry {
  user_id: string
  display_name: string | null
  username: string | null
  total_pages_discovered: number
  last_discovery_at: string | null
  first_discoveries_count: number
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .limit(100)

      if (data) {
        setLeaderboard(data as LeaderboardEntry[])
      }
      setLoading(false)
    }

    fetchData()
  }, [])

  const getRankSuffix = (rank: number) => {
    if (rank === 1) return 'st'
    if (rank === 2) return 'nd'
    if (rank === 3) return 'rd'
    return 'th'
  }

  const getMedalEmoji = (rank: number) => {
    if (rank === 1) return '1'
    if (rank === 2) return '2'
    if (rank === 3) return '3'
    return rank.toString()
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
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-mono font-bold text-foreground">
              leaderboard
            </h1>
            <p className="text-muted-foreground font-mono">
              top explorers of this normal website
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="font-mono">rankings</CardTitle>
              <CardDescription className="font-mono">
                sorted by unique pages discovered
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground font-mono">
                  loading...
                </div>
              ) : leaderboard.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground font-mono">
                  no discoverers yet. be the first!
                </div>
              ) : (
                <div className="space-y-2">
                  {leaderboard.map((entry, index) => {
                    const rank = index + 1
                    const isCurrentUser = user?.id === entry.user_id

                    return (
                      <div
                        key={entry.user_id}
                        className={`flex items-center justify-between p-4 rounded-lg border ${
                          isCurrentUser
                            ? 'bg-primary/10 border-primary/30'
                            : 'bg-card border-border'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 flex items-center justify-center rounded font-mono font-bold ${
                            rank <= 3
                              ? 'bg-primary/20 text-primary'
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {getMedalEmoji(rank)}
                          </div>

                          <div>
                            <div className="font-mono font-medium text-foreground">
                              {entry.display_name || entry.username || 'anonymous explorer'}
                              {isCurrentUser && (
                                <span className="ml-2 text-xs text-primary">(you)</span>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground font-mono">
                              {entry.first_discoveries_count > 0 && (
                                <span className="text-primary">
                                  {entry.first_discoveries_count} first {entry.first_discoveries_count === 1 ? 'discovery' : 'discoveries'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-2xl font-mono font-bold text-primary">
                            {entry.total_pages_discovered}
                          </div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {entry.total_pages_discovered === 1 ? 'page' : 'pages'}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {!user && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground font-mono mb-4">
                want to join the leaderboard?
              </p>
              <Link href="/auth/signup">
                <Button className="font-mono">
                  create an account
                </Button>
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
