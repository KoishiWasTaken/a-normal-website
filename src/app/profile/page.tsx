'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { User, Trophy, Clock, Target } from 'lucide-react'
import MobileNav from '@/components/MobileNav'

interface UserProfile {
  username: string | null
  display_name: string | null
  email: string | null
  created_at: string
}

interface UserStats {
  total_pages_discovered: number
  last_discovery_at: string | null
  first_discoveries_count: number
  discovered_pages: any[]
}

interface LeaderboardRank {
  rank: number
  total_users: number
}

export default function ProfilePage() {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [rank, setRank] = useState<LeaderboardRank | null>(null)
  const [totalPages, setTotalPages] = useState(0)
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

      // Track page discovery
      await supabase.rpc('record_page_discovery', {
        p_user_id: user.id,
        p_page_key: 'profile'
      })

      // Fetch user profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('username, display_name, email, created_at')
        .eq('id', user.id)
        .single()

      if (profileData) {
        setProfile(profileData)
      }

      // Fetch user statistics
      const { data: statsData } = await supabase
        .from('user_statistics')
        .select('total_pages_discovered, last_discovery_at, first_discoveries, discovered_pages')
        .eq('user_id', user.id)
        .single()

      if (statsData) {
        const firstDiscoveries = Array.isArray(statsData.first_discoveries)
          ? statsData.first_discoveries.length
          : 0

        setStats({
          total_pages_discovered: statsData.total_pages_discovered,
          last_discovery_at: statsData.last_discovery_at,
          first_discoveries_count: firstDiscoveries,
          discovered_pages: statsData.discovered_pages || []
        })
      }

      // Get total number of pages
      const { count } = await supabase
        .from('pages')
        .select('*', { count: 'exact', head: true })

      setTotalPages(count || 0)

      // Calculate rank on leaderboard
      const { data: leaderboardData } = await supabase
        .from('leaderboard')
        .select('user_id, total_pages_discovered')
        .order('total_pages_discovered', { ascending: false })

      if (leaderboardData) {
        const userIndex = leaderboardData.findIndex(entry => entry.user_id === user.id)
        if (userIndex !== -1) {
          setRank({
            rank: userIndex + 1,
            total_users: leaderboardData.length
          })
        }
      }

      setLoading(false)
    }

    fetchData()
  }, [router, supabase])

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

  const getOrdinalSuffix = (num: number) => {
    const j = num % 10
    const k = num % 100
    if (j === 1 && k !== 11) return 'st'
    if (j === 2 && k !== 12) return 'nd'
    if (j === 3 && k !== 13) return 'rd'
    return 'th'
  }

  const getCompletionPercentage = () => {
    if (!stats || totalPages === 0) return 0
    return Math.round((stats.total_pages_discovered / totalPages) * 100)
  }

  const getMemberDuration = () => {
    if (!profile?.created_at) return 'unknown'
    const created = new Date(profile.created_at)
    const now = new Date()
    const days = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))

    if (days === 0) return 'joined today'
    if (days === 1) return '1 day'
    if (days < 30) return `${days} days`
    if (days < 365) return `${Math.floor(days / 30)} months`
    return `${Math.floor(days / 365)} years`
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
        <div className="max-w-3xl mx-auto space-y-4 md:space-y-6">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground font-mono">
              loading...
            </div>
          ) : (
            <>
              {/* Profile Header */}
              <Card className="border-primary/20">
                <CardContent className="pt-4 md:pt-6">
                  <div className="flex flex-col sm:flex-row items-start gap-4">
                    <div className="flex items-start gap-3 md:gap-4 flex-1 min-w-0">
                      <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <User className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h1 className="text-2xl md:text-3xl font-mono font-bold text-foreground truncate">
                          {profile?.username || 'anonymous'}
                        </h1>
                        <p className="text-xs md:text-sm text-muted-foreground font-mono mt-1 truncate">
                          {profile?.email}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono mt-2">
                          member for {getMemberDuration()}
                        </p>
                      </div>
                    </div>
                    <Link href="/settings" className="w-full sm:w-auto">
                      <Button variant="outline" size="sm" className="font-mono w-full sm:w-auto">
                        edit profile
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Stats Overview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <Card>
                  <CardContent className="pt-4 md:pt-6">
                    <div className="flex items-center gap-2 md:gap-3">
                      <Target className="w-4 h-4 md:w-5 md:h-5 text-primary flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xl md:text-2xl font-bold text-primary font-mono">
                          {stats?.total_pages_discovered || 0}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono">
                          pages found
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4 md:pt-6">
                    <div className="flex items-center gap-2 md:gap-3">
                      <Trophy className="w-4 h-4 md:w-5 md:h-5 text-primary flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xl md:text-2xl font-bold text-primary font-mono">
                          {stats?.first_discoveries_count || 0}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono">
                          first finds
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4 md:pt-6">
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="w-4 h-4 md:w-5 md:h-5 flex items-center justify-center flex-shrink-0">
                        <span className="text-base md:text-lg font-mono text-primary">#</span>
                      </div>
                      <div className="min-w-0">
                        <div className="text-xl md:text-2xl font-bold text-primary font-mono">
                          {rank ? `${rank.rank}${getOrdinalSuffix(rank.rank)}` : '-'}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono">
                          rank
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4 md:pt-6">
                    <div className="flex items-center gap-2 md:gap-3">
                      <Clock className="w-4 h-4 md:w-5 md:h-5 text-primary flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xl md:text-2xl font-bold text-primary font-mono">
                          {getCompletionPercentage()}%
                        </div>
                        <div className="text-xs text-muted-foreground font-mono">
                          complete
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="font-mono">discovery progress</CardTitle>
                    <CardDescription className="font-mono">
                      your exploration statistics
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm font-mono">
                        <span className="text-muted-foreground">total pages</span>
                        <span className="text-foreground">{totalPages}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary rounded-full h-2 transition-all"
                          style={{ width: `${getCompletionPercentage()}%` }}
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground font-mono">discovered</span>
                        <span className="text-sm text-foreground font-mono">
                          {stats?.total_pages_discovered || 0} / {totalPages}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground font-mono">remaining</span>
                        <span className="text-sm text-foreground font-mono">
                          {totalPages - (stats?.total_pages_discovered || 0)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="font-mono">recent activity</CardTitle>
                    <CardDescription className="font-mono">
                      your latest discoveries
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="text-sm text-muted-foreground font-mono mb-1">
                        last discovery
                      </div>
                      <div className="text-foreground font-mono">
                        {formatDate(stats?.last_discovery_at || null)}
                      </div>
                    </div>

                    {rank && (
                      <div className="pt-2 border-t border-border">
                        <div className="text-sm text-muted-foreground font-mono mb-1">
                          leaderboard position
                        </div>
                        <div className="text-foreground font-mono">
                          {rank.rank}{getOrdinalSuffix(rank.rank)} of {rank.total_users} explorers
                        </div>
                      </div>
                    )}

                    {stats?.first_discoveries_count > 0 && (
                      <div className="pt-2 border-t border-border">
                        <div className="text-sm text-primary font-mono">
                          ★ {stats.first_discoveries_count} first {stats.first_discoveries_count === 1 ? 'discovery' : 'discoveries'}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Account Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-mono">account information</CardTitle>
                  <CardDescription className="font-mono">
                    technical details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground font-mono">username</div>
                      <div className="text-foreground font-mono">{profile?.username || 'not set'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground font-mono">email</div>
                      <div className="text-foreground font-mono">{profile?.email}</div>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground font-mono">user id</div>
                    <div className="text-xs text-foreground font-mono break-all opacity-50">{user?.id}</div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-mono">actions</CardTitle>
                </CardHeader>
                <CardContent className="flex gap-3">
                  <Link href="/settings" className="flex-1">
                    <Button variant="outline" className="w-full font-mono">
                      settings
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    onClick={handleSignOut}
                    className="flex-1 font-mono"
                  >
                    sign out
                  </Button>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
