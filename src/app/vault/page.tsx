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
  const [grid, setGrid] = useState<boolean[][]>(
    Array(4).fill(null).map(() => Array(4).fill(false))
  )
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const toggleCell = (row: number, col: number) => {
    setGrid(prevGrid => {
      const newGrid = prevGrid.map(r => [...r])
      newGrid[row][col] = !newGrid[row][col]
      return newGrid
    })
    setError(null)
  }

  const checkPattern = () => {
    // Convert grid to string for pattern matching
    const pattern = grid.map(row => row.map(cell => cell ? '1' : '0').join('')).join('')

    // Debug: log the pattern
    console.log('Warp pattern entered:', pattern)

    // Define valid patterns and their destinations
    const patterns: { [key: string]: string } = {
      '1001110110111001': '/warp/invertigo',
      '0101110100011111': '/warp/radar',
      '0000000000000001': '/warp/endoftheend',
      // Add more patterns here as you create more secret pages
    }

    console.log('Valid patterns:', Object.keys(patterns))
    console.log('Pattern match:', patterns[pattern] || 'none')

    if (patterns[pattern]) {
      // Valid pattern - navigate to the secret page
      router.push(patterns[pattern])
    } else {
      // Invalid pattern
      setError('invalid pattern. please try again.')
    }
  }

  const resetGrid = () => {
    setGrid(Array(4).fill(null).map(() => Array(4).fill(false)))
    setError(null)
  }

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
                  this is the vault - a gateway to hidden locations. the warp gate below can transport
                  you to different parts of the site that aren't accessible through normal navigation.
                </p>
                <p className="text-sm md:text-base text-blue-200/80 font-mono leading-relaxed">
                  each pattern unlocks a different destination. you'll need to figure out the right
                  combinations. some patterns might be found through clues scattered across the site.
                </p>
                <p className="text-xs md:text-sm text-blue-300/50 font-mono italic">
                  experiment. explore. there's more here than meets the eye.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Pattern Grid */}
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl md:text-3xl font-mono font-bold text-blue-400">
                warp gate
              </h2>
              <p className="text-sm text-blue-300/60 font-mono">
                configure pattern to access hidden locations
              </p>
            </div>

            <Card className="border-blue-900/50 bg-slate-900/50 backdrop-blur">
              <CardContent className="pt-8 pb-8">
                {/* 4x4 Grid */}
                <div className="flex flex-col items-center gap-6">
                  <div className="inline-grid grid-cols-4 gap-2 p-4 rounded-lg bg-slate-950/50 border border-blue-900/30">
                    {grid.map((row, rowIndex) => (
                      row.map((cell, colIndex) => (
                        <button
                          key={`${rowIndex}-${colIndex}`}
                          onClick={() => toggleCell(rowIndex, colIndex)}
                          className={`w-12 h-12 md:w-16 md:h-16 rounded-lg border-2 transition-all duration-200 ${
                            cell
                              ? 'bg-blue-400 border-blue-300 shadow-lg shadow-blue-400/50'
                              : 'bg-black border-blue-900/50 hover:border-blue-700'
                          }`}
                          aria-label={`Cell ${rowIndex + 1}-${colIndex + 1}`}
                        />
                      ))
                    ))}
                  </div>

                  {/* Controls */}
                  <div className="flex flex-col items-center gap-3 w-full max-w-xs">
                    <Button
                      onClick={checkPattern}
                      className="w-full font-mono bg-blue-600 hover:bg-blue-500 text-white"
                    >
                      warp
                    </Button>

                    <Button
                      onClick={resetGrid}
                      variant="outline"
                      className="w-full font-mono text-blue-400 border-blue-400/30 hover:bg-blue-950/50"
                    >
                      reset
                    </Button>

                    {/* Error Message */}
                    {error && (
                      <div className="w-full p-3 rounded border border-red-500/30 bg-red-950/20">
                        <p className="text-sm text-red-400 font-mono text-center">
                          {error}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Hint Card */}
          <Card className="border-blue-500/30 bg-blue-950/20">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <p className="text-sm font-mono text-blue-300">
                  how it works:
                </p>
                <p className="text-xs md:text-sm font-mono text-blue-200/70 leading-relaxed">
                  click boxes to toggle between off (black) and on (white). different patterns unlock different locations.
                  find the right patterns to discover what's hidden. there's no limit on attempts.
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
