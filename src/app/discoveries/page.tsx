'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronRight, Lock, ExternalLink } from 'lucide-react'

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
                discoveries
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
            <Link href="/settings">
              <Button variant="ghost" className="font-mono">
                settings
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-4">
          <div className="space-y-2">
            <h1 className="text-4xl font-mono font-bold text-foreground">
              discoveries
            </h1>
            <p className="text-muted-foreground font-mono">
              {allPages.filter(p => p.discovered).length} of {allPages.length} pages discovered
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12 text-muted-foreground font-mono">
              loading your discoveries...
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Sidebar */}
              <div className="lg:col-span-1">
                <Card className="sticky top-4">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-mono">entries</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="space-y-1">
                      {allPages.map((page, index) => (
                        <button
                          key={page.id}
                          onClick={() => setSelectedPage(page)}
                          className={`w-full text-left px-4 py-2 font-mono text-sm transition-colors flex items-center justify-between ${
                            selectedPage?.id === page.id
                              ? 'bg-primary/10 text-primary border-l-2 border-primary'
                              : 'hover:bg-muted text-foreground'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            {!page.discovered && <Lock size={14} />}
                            <span>
                              {page.discovered ? page.page_name : '???'}
                            </span>
                          </span>
                          {selectedPage?.id === page.id && (
                            <ChevronRight size={16} />
                          )}
                        </button>
                      ))}
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
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <CardTitle className="text-2xl font-mono">
                              {selectedPage.page_name}
                            </CardTitle>
                            <CardDescription className="font-mono text-xs">
                              {selectedPage.page_url}
                            </CardDescription>
                          </div>
                          {selectedPage.can_navigate && (
                            <Link href={selectedPage.page_url}>
                              <Button size="sm" className="font-mono gap-2">
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
                            <h3 className="text-sm font-mono text-muted-foreground uppercase">
                              description
                            </h3>
                            <p className="text-foreground font-mono leading-relaxed">
                              {selectedPage.page_description}
                            </p>
                          </div>
                        )}

                        {/* How to Access */}
                        {selectedPage.how_to_access && (
                          <div className="space-y-2">
                            <h3 className="text-sm font-mono text-muted-foreground uppercase">
                              how to access
                            </h3>
                            <p className="text-foreground font-mono leading-relaxed">
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

                              {selectedPage.discovery.discovery_number !== null && (
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
