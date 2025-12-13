'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { recordPageDiscovery } from '@/lib/utils'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Folder, File, ChevronRight, Home } from 'lucide-react'

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'.split('')

// Define puzzle combinations that lead to files
// Format: { path: 'a/b/c', fileName: 'secret.txt', destination: '/some/page' }
const PUZZLE_COMBINATIONS: Array<{ path: string; fileName: string; destination: string }> = [
  { path: 'v/e/n/u/s', fileName: 'venus.dat', destination: '/celestial/inferno' }
]

export default function LibraryOfBabelPage() {
  const [tracked, setTracked] = useState(false)
  const [path, setPath] = useState<string[]>([])
  const supabase = createClient()

  useEffect(() => {
    const trackDiscovery = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (user && !tracked) {
        // Track page discovery
      await recordPageDiscovery(supabase, user.id, 'libraryofbabel')
        setTracked(true)
      }
    }

    trackDiscovery()
  }, [supabase, tracked])

  const currentPathString = path.join('/')
  const matchingPuzzle = PUZZLE_COMBINATIONS.find(p => p.path === currentPathString)

  const handleFolderClick = (folder: string) => {
    setPath([...path, folder])
  }

  const handleNavigateUp = () => {
    setPath(path.slice(0, -1))
  }

  const handleGoToRoot = () => {
    setPath([])
  }

  const handlePathClick = (index: number) => {
    setPath(path.slice(0, index + 1))
  }

  return (
    <div className="min-h-screen bg-[#f5f5dc]">
      {/* Header */}
      <header className="border-b-2 border-[#8b4513] bg-[#d2b48c]">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-lg md:text-xl text-[#4a4a4a] hover:text-[#8b4513] transition-colors" style={{ fontFamily: 'Times New Roman, serif' }}>
            a normal website
          </Link>
          <Link href="/archive">
            <Button variant="outline" className="border-2 border-[#8b4513] text-[#4a4a4a] hover:bg-[#8b4513] hover:text-white" style={{ fontFamily: 'Times New Roman, serif' }}>
              archive
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 md:py-16">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Title */}
          <div className="text-center space-y-3">
            <h1 className="text-4xl md:text-5xl font-bold text-[#4a4a4a]" style={{ fontFamily: 'Times New Roman, serif' }}>
              The Library of Babel
            </h1>
            <p className="text-lg text-[#6a6a6a] italic" style={{ fontFamily: 'Times New Roman, serif' }}>
              "The universe (which others call the Library) is composed of an indefinite and perhaps infinite number of hexagonal galleries..."
            </p>
            <p className="text-sm text-[#8a8a8a]" style={{ fontFamily: 'Times New Roman, serif' }}>
              — Jorge Luis Borges
            </p>
          </div>

          {/* Navigation */}
          <Card className="border-2 border-[#8b4513] bg-white shadow-lg">
            <CardHeader className="border-b-2 border-[#8b4513] bg-[#faf0e6]">
              <div className="flex items-center justify-between">
                <CardTitle className="text-[#4a4a4a]" style={{ fontFamily: 'Times New Roman, serif' }}>
                  Current Directory
                </CardTitle>
                <div className="flex gap-2">
                  {path.length > 0 && (
                    <Button
                      onClick={handleNavigateUp}
                      variant="outline"
                      size="sm"
                      className="border-[#8b4513] text-[#4a4a4a] hover:bg-[#8b4513] hover:text-white"
                      style={{ fontFamily: 'Times New Roman, serif' }}
                    >
                      ← Up
                    </Button>
                  )}
                  {path.length > 0 && (
                    <Button
                      onClick={handleGoToRoot}
                      variant="outline"
                      size="sm"
                      className="border-[#8b4513] text-[#4a4a4a] hover:bg-[#8b4513] hover:text-white"
                      style={{ fontFamily: 'Times New Roman, serif' }}
                    >
                      <Home size={16} />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {/* Breadcrumb Path */}
              <div className="mb-4 p-3 bg-[#faf0e6] border border-[#d2b48c] rounded">
                <div className="flex items-center gap-2 flex-wrap text-[#4a4a4a]" style={{ fontFamily: 'Times New Roman, serif' }}>
                  <button
                    onClick={handleGoToRoot}
                    className="hover:text-[#8b4513] transition-colors"
                  >
                    /
                  </button>
                  {path.map((folder, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <ChevronRight size={16} className="text-[#8a8a8a]" />
                      <button
                        onClick={() => handlePathClick(index)}
                        className="hover:text-[#8b4513] transition-colors"
                      >
                        {folder}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Content Area */}
              {matchingPuzzle ? (
                /* Show file if puzzle combination matched */
                <div className="space-y-4">
                  <p className="text-[#6a6a6a] italic" style={{ fontFamily: 'Times New Roman, serif' }}>
                    This directory contains a single file...
                  </p>
                  <Link href={matchingPuzzle.destination}>
                    <button className="w-full flex items-center gap-3 p-4 bg-white border-2 border-[#8b4513] rounded hover:bg-[#faf0e6] transition-colors group">
                      <File size={24} className="text-[#8b4513]" />
                      <span className="text-lg text-[#4a4a4a] group-hover:text-[#8b4513] transition-colors" style={{ fontFamily: 'Times New Roman, serif' }}>
                        {matchingPuzzle.fileName}
                      </span>
                    </button>
                  </Link>
                </div>
              ) : (
                /* Show folders A-Z */
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {ALPHABET.map((letter) => (
                    <button
                      key={letter}
                      onClick={() => handleFolderClick(letter)}
                      className="flex items-center gap-2 p-3 bg-white border-2 border-[#8b4513] rounded hover:bg-[#faf0e6] transition-colors group"
                    >
                      <Folder size={20} className="text-[#d2b48c] group-hover:text-[#8b4513] transition-colors" />
                      <span className="text-[#4a4a4a] group-hover:text-[#8b4513] transition-colors" style={{ fontFamily: 'Times New Roman, serif' }}>
                        {letter}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Info text */}
              <div className="mt-6 pt-6 border-t border-[#d2b48c]">
                <p className="text-sm text-[#8a8a8a] text-center italic" style={{ fontFamily: 'Times New Roman, serif' }}>
                  {matchingPuzzle
                    ? 'A curious discovery...'
                    : 'Navigate through the infinite corridors of folders. Each path may lead to something... or nothing at all.'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Flavor Text */}
          <Card className="border-2 border-[#8b4513] bg-[#faf0e6]">
            <CardContent className="pt-6">
              <p className="text-sm text-[#6a6a6a] leading-relaxed" style={{ fontFamily: 'Times New Roman, serif' }}>
                The Library contains all possible combinations of letters, all books that have been written and all that ever will be written.
                Each hexagon contains books on shelves, each book contains pages, each page contains lines.
                Somewhere in this infinite labyrinth, every truth and every lie exists in written form.
                The question is not whether something exists here, but whether you can find it.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
