'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { User, Trophy, Target, Clock } from 'lucide-react'
import MobileNav from '@/components/MobileNav'

interface UserProfile {
  id: string
  username: string | null
  display_name: string | null
  bio: string | null
  created_at: string
}

interface UserStats {
  total_pages_discovered: number
  last_discovery_at: string | null
  first_discoveries_count: number
}

interface LeaderboardRank {
  rank: number
  total_users: number
}

export default function PublicProfilePage() {
  const params = useParams()
  const username = params?.username as string
  const [currentUser, setCurrentUser] = useState<{ id: string; email?: string } | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [rank, setRank] = useState<LeaderboardRank | null>(null)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)

      // Fetch profile by username
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, display_name, bio, created_at')
        .eq('username', username)
        .single()

      if (profileError || !profileData) {
        setNotFound(true)
        setLoading(false)
        return
      }

      // If viewing your own profile, redirect to /profile
      if (user && profileData.id === user.id) {
        router.push('/profile')
        return
      }

      setProfile(profileData)

      // Fetch user statistics
      const { data: statsData } = await supabase
        .from('user_statistics')
        .select('total_pages_discovered, last_discovery_at, first_discoveries')
        .eq('user_id', profileData.id)
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
        const userIndex = leaderboardData.findIndex(entry => entry.user_id === profileData.id)
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
  }, [username, router, supabase])

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

  if (notFound) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border sticky top-0 bg-background z-40">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="text-lg md:text-xl font-mono text-foreground hover:text-primary transition-colors">
              a normal website
            </Link>
            <MobileNav user={currentUser} />
          </div>
        </header>
        <main className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center space-y-4">
            <h1 className="text-3xl font-mono font-bold text-foreground">
              user not found
            </h1>
            <p className="text-muted-foreground font-mono">
              the profile you're looking for doesn't exist
            </p>
            <Link href="/leaderboard">
              <Button className="font-mono">
                ← back to leaderboard
              </Button>
            </Link>
          </div>
        </main>
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
          <MobileNav user={currentUser} />
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
                  <div className="flex items-start gap-3 md:gap-4">
                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <User className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h1 className="text-2xl md:text-3xl font-mono font-bold text-foreground truncate">
                        {profile?.username || 'anonymous'}
                      </h1>
                      <p className="text-xs text-muted-foreground font-mono mt-2">
                        member for {getMemberDuration()}
                      </p>
                      {profile?.bio ? (
                        <p className="text-sm text-foreground font-mono mt-3 whitespace-pre-wrap">
                          {profile.bio}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground font-mono mt-3 italic">
                          no bio set
                        </p>
                      )}
                    </div>
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

                <Card className="col-span-2">
                  <CardContent className="pt-4 md:pt-6">
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-mono text-muted-foreground">
                        <span>completion</span>
                        <span>{getCompletionPercentage()}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-primary h-full transition-all duration-300"
                          style={{ width: `${getCompletionPercentage()}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Leaderboard Position */}
              {rank && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center space-y-2">
                      <p className="text-sm text-muted-foreground font-mono">
                        leaderboard position
                      </p>
                      <p className="text-3xl font-bold text-primary font-mono">
                        #{rank.rank}
                        <span className="text-lg text-muted-foreground ml-1">
                          of {rank.total_users}
                        </span>
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Discovery Stats */}
              {stats && (
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-mono text-muted-foreground">
                          last discovery
                        </span>
                      </div>
                      <span className="text-sm font-mono text-foreground">
                        {formatDate(stats.last_discovery_at)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Back Button */}
              <div className="text-center">
                <Link href="/leaderboard">
                  <Button variant="ghost" className="font-mono">
                    ← back to leaderboard
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
