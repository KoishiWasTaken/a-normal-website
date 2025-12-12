'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronRight, Lock, ExternalLink } from 'lucide-react'
import MobileNav from '@/components/MobileNav'

interface PageInfo {
  id: string
  page_key: string
  page_name: string
  page_url: string
  page_description: string | null
  how_to_access: string | null
  can_navigate: boolean
  discovery_order: number | null
}

interface Discovery {
  discovered_at: string
  discovery_number: number | null
  page: PageInfo
  total_discoverers?: number
}

interface AllPagesEntry extends PageInfo {
  discovered: boolean
  discovery?: Discovery
}

type DifficultyLevel = 'plain' | 'atypical' | 'bizarre' | 'cryptic' | 'diabolical' | 'enigmatic'

interface DifficultyConfig {
  symbol: string
  label: string
  color: string
}

const difficultyLevels: Record<DifficultyLevel, DifficultyConfig> = {
  plain: { symbol: '○', label: 'Plain', color: 'text-muted-foreground' },
  atypical: { symbol: 'α', label: 'Atypical', color: 'text-blue-400' },
  bizarre: { symbol: 'β', label: 'Bizarre', color: 'text-purple-400' },
  cryptic: { symbol: 'γ', label: 'Cryptic', color: 'text-orange-400' },
  diabolical: { symbol: 'δ', label: 'Diabolical', color: 'text-red-400' },
  enigmatic: { symbol: 'ε', label: 'Enigmatic', color: 'text-pink-400' }
}

const pageDifficulties: Record<string, DifficultyLevel> = {
  homepage: 'plain',
  archive: 'plain',
  profile: 'plain',
  leaderboard: 'plain',
  settings: 'plain',
  '404': 'plain',
  forbidden: 'plain',
  vault: 'atypical',
  invertigo: 'atypical',
  radar: 'atypical',
  endoftheend: 'atypical',
  friendzone: 'atypical',
  '4O4': 'atypical',
  beginningofthebeginning: 'bizarre',
  fortheworthy: 'bizarre',
  libraryofbabel: 'bizarre'
}

export default function IndexPage() {
  const [allPages, setAllPages] = useState<AllPagesEntry[]>([])
  const [selectedPage, setSelectedPage] = useState<AllPagesEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
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
        p_page_key: 'archive'
      })

      // Fetch ALL pages
      const { data: allPagesData } = await supabase
        .from('pages')
        .select('*')
        .order('discovery_order', { ascending: true })

      if (!allPagesData) {
        setLoading(false)
        return
      }

      // Fetch user's discoveries
      const { data: discoveryData } = await supabase
        .from('page_discoveries')
        .select(`
          id,
          page_id,
          discovered_at,
          discovery_number,
          pages!inner(
            id,
            page_key,
            page_name,
            page_url,
            page_description,
            how_to_access,
            can_navigate,
            discovery_order
          )
        `)
        .eq('user_id', user.id)

      // Get statistics for discovered pages
      const discoveredPageIds = discoveryData?.map((d: any) => d.page_id) || []
      const { data: statsData } = await supabase
        .from('page_statistics')
        .select('page_id, unique_discoverers')
        .in('page_id', discoveredPageIds)

      const statsMap = new Map(statsData?.map((s) => [s.page_id, s.unique_discoverers]))

      // Combine all pages with discovery status
      const enrichedPages: AllPagesEntry[] = allPagesData.map((page) => {
        const discovery = discoveryData?.find((d: any) => d.page_id === page.id)

        if (discovery) {
          return {
            ...page,
            discovered: true,
            discovery: {
              discovered_at: discovery.discovered_at,
              discovery_number: discovery.discovery_number,
              page: Array.isArray(discovery.pages) ? discovery.pages[0] : discovery.pages,
              total_discoverers: statsMap.get(page.id) || 0
            }
          }
        }

        return {
          ...page,
          discovered: false
        }
      })

      setAllPages(enrichedPages)
      // Select homepage by default
      const homepage = enrichedPages.find(p => p.page_key === 'homepage') || enrichedPages[0]
      setSelectedPage(homepage)
      setLoading(false)
    }

    fetchData()
  }, [router, supabase])

  const getOrdinalSuffix = (num: number) => {
    const j = num % 10
    const k = num % 100
    if (j === 1 && k !== 11) return 'st'
    if (j === 2 && k !== 12) return 'nd'
    if (j === 3 && k !== 13) return 'rd'
    return 'th'
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getDifficulty = (pageKey: string): DifficultyConfig => {
    const level = pageDifficulties[pageKey] || 'plain'
    return difficultyLevels[level]
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
      <main className="container mx-auto px-4 py-6 md:py-8">
        <div className="space-y-4">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-mono font-bold text-foreground">
              archive
            </h1>
            <p className="text-sm md:text-base text-muted-foreground font-mono">
              {allPages.filter(p => p.discovered).length} of {allPages.length} pages discovered
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12 text-muted-foreground font-mono">
              loading your discoveries...
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
              {/* Sidebar */}
              <div className="lg:col-span-1">
                <Card className="lg:sticky lg:top-20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base md:text-lg font-mono">entries</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="space-y-1 max-h-[400px] lg:max-h-[calc(100vh-200px)] overflow-y-auto">
                      {allPages.map((page, index) => {
                        const difficulty = getDifficulty(page.page_key)
                        return (
                          <button
                            key={page.id}
                            onClick={() => setSelectedPage(page)}
                            className={`w-full text-left px-3 md:px-4 py-2 font-mono text-xs md:text-sm transition-colors flex items-center justify-between ${
                              selectedPage?.id === page.id
                                ? 'bg-primary/10 text-primary border-l-2 border-primary'
                                : 'hover:bg-muted text-foreground'
                            }`}
                          >
                            <span className="flex items-center gap-2 truncate">
                              {!page.discovered && <Lock size={12} className="md:w-[14px] md:h-[14px] flex-shrink-0" />}
                              {page.discovered && (
                                <span className={`${difficulty.color} font-bold flex-shrink-0`} title={difficulty.label}>
                                  {difficulty.symbol}
                                </span>
                              )}
                              <span className="truncate">
                                {page.discovered ? page.page_name : '???'}
                              </span>
                            </span>
                            {selectedPage?.id === page.id && (
                              <ChevronRight size={14} className="md:w-4 md:h-4 flex-shrink-0" />
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Main Content Area */}
              <div className="lg:col-span-3">
                {selectedPage ? (
                  selectedPage.discovered ? (
                    /* Discovered Page */
                    <Card>
                      <CardHeader>
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <div className="flex items-center gap-3 flex-wrap">
                              <CardTitle className="text-xl md:text-2xl font-mono">
                                {selectedPage.page_name}
                              </CardTitle>
                              {(() => {
                                const difficulty = getDifficulty(selectedPage.page_key)
                                return (
                                  <span
                                    className={`${difficulty.color} font-mono text-xs px-2 py-1 border rounded ${difficulty.color.replace('text-', 'border-')}`}
                                    title={`Difficulty: ${difficulty.label}`}
                                  >
                                    {difficulty.symbol} {difficulty.label}
                                  </span>
                                )
                              })()}
                            </div>
                            <CardDescription className="font-mono text-xs break-all">
                              {selectedPage.page_url}
                            </CardDescription>
                          </div>
                          {selectedPage.can_navigate && (
                            <Link href={selectedPage.page_url} className="block sm:inline-block">
                              <Button size="sm" className="font-mono gap-2 w-full sm:w-auto">
                                <ExternalLink size={16} />
                                visit
                              </Button>
                            </Link>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Description */}
                        {selectedPage.page_description && (
                          <div className="space-y-2">
                            <h3 className="text-xs md:text-sm font-mono text-muted-foreground uppercase">
                              description
                            </h3>
                            <p className="text-sm md:text-base text-foreground font-mono leading-relaxed">
                              {selectedPage.page_description}
                            </p>
                          </div>
                        )}

                        {/* How to Access */}
                        {selectedPage.how_to_access && (
                          <div className="space-y-2">
                            <h3 className="text-xs md:text-sm font-mono text-muted-foreground uppercase">
                              how to access
                            </h3>
                            <p className="text-sm md:text-base text-foreground font-mono leading-relaxed">
                              {selectedPage.how_to_access}
                            </p>
                          </div>
                        )}

                        {/* Discovery Stats */}
                        {selectedPage.discovery && (
                          <div className="pt-4 border-t border-border space-y-3">
                            <h3 className="text-sm font-mono text-muted-foreground uppercase">
                              your discovery
                            </h3>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <div className="text-xs text-muted-foreground font-mono">
                                  discovered
                                </div>
                                <div className="text-sm text-foreground font-mono">
                                  {formatDate(selectedPage.discovery.discovered_at)}
                                </div>
                              </div>

                              {selectedPage.discovery.discovery_number !== null ? (
                                <>
                                  <div>
                                    <div className="text-xs text-muted-foreground font-mono">
                                      you were
                                    </div>
                                    <div className="text-sm font-mono">
                                      <span className="text-primary font-bold">
                                        {selectedPage.discovery.discovery_number}
                                        {getOrdinalSuffix(selectedPage.discovery.discovery_number)}
                                      </span>
                                      <span className="text-muted-foreground"> discoverer</span>
                                    </div>
                                  </div>

                                  <div>
                                    <div className="text-xs text-muted-foreground font-mono">
                                      total discoverers
                                    </div>
                                    <div className="text-sm text-foreground font-mono">
                                      {selectedPage.discovery.total_discoverers || 0}
                                    </div>
                                  </div>
                                </>
                              ) : (
                                <div className="col-span-2">
                                  <div className="text-xs text-muted-foreground font-mono mb-1">
                                    total discoverers
                                  </div>
                                  <div className="text-sm text-foreground font-mono">
                                    {selectedPage.discovery.total_discoverers || 0}
                                  </div>
                                </div>
                              )}
                            </div>

                            {selectedPage.discovery.discovery_number === 1 && (
                              <div className="pt-2">
                                <span className="text-xs font-mono text-primary">
                                  ★ first discovery
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ) : (
                    /* Undiscovered Page */
                    <Card className="border-dashed">
                      <CardContent className="py-20 text-center">
                        <div className="space-y-4">
                          <Lock size={48} className="mx-auto text-muted-foreground opacity-30" />
                          <div>
                            <h2 className="text-2xl font-mono font-bold text-muted-foreground">
                              undiscovered entry
                            </h2>
                            <p className="text-sm text-muted-foreground font-mono mt-2">
                              you haven't found this page yet
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <p className="text-muted-foreground font-mono">
                        select an entry from the sidebar
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
