'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Menu, X } from 'lucide-react'

interface MobileNavProps {
  user: { id: string; email?: string } | null
}

export default function MobileNav({ user }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="md:hidden">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="font-mono"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </Button>
      </div>

      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center gap-4">
        {user ? (
          <>
            <Link href="/archive">
              <Button variant="ghost" className="font-mono">
                archive
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

      {/* Mobile Navigation Dropdown */}
      {isOpen && (
        <div className="md:hidden absolute top-[57px] left-0 right-0 bg-background border-b border-border shadow-lg z-50">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-2">
            {user ? (
              <>
                <Link href="/archive" onClick={() => setIsOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start font-mono">
                    archive
                  </Button>
                </Link>
                <Link href="/leaderboard" onClick={() => setIsOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start font-mono">
                    leaderboard
                  </Button>
                </Link>
                <Link href="/profile" onClick={() => setIsOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start font-mono">
                    profile
                  </Button>
                </Link>
                <Link href="/settings" onClick={() => setIsOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start font-mono">
                    settings
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/auth/signin" onClick={() => setIsOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start font-mono">
                    sign in
                  </Button>
                </Link>
                <Link href="/auth/signup" onClick={() => setIsOpen(false)}>
                  <Button variant="default" className="w-full font-mono">
                    sign up
                  </Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </>
  )
}
