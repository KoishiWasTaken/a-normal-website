'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { recordPageDiscovery } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import MobileNav from '@/components/MobileNav'

const headlines = [
  "you can find the homepage at https://anormalwebsite.xyz/",
  "the archive can help you quick travel to Atypical pages",
  "don't check your profile, there's nothing useful there",
  "maybe ask some of the top users on the leaderboard for help?",
  "you can set your fun value in the settings at any time",
  "have you tried brute-forcing the url?",
  "sometimes you might need extra requirements to properly see a page",
  "there's a really small button somewhere in the homepage...",
  "have you tried warping to N?",
  "0101110100011111",
  "bottom right corner",
  "maybe you need a *plus* one for help",
  "reserved for your friend. probably.",
  "one of these error pages are not like the others",
  "i hope the homepage jumpscare didn't get you",
  "maybe go afk for a bit and touch some grass",
  "there's something in the end, you just can't see it",
  "what's the celestial symbol for saturn?",
  "if only you knew how much fun there is",
  "if you need help, try reading me!",
  "not all of these are hints, but i won't tell you which :^)",
  "i ran out of things to say here",
  "this hint actually takes you somewhere"
]

export default function HelpPage() {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [currentHeadline, setCurrentHeadline] = useState('')
  const [isTerminalHint, setIsTerminalHint] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/signin')
        return
      }

      setUser(user)
      await recordPageDiscovery(supabase, user.id, 'help')
    }

    init()
  }, [router, supabase])

  useEffect(() => {
    // Pick a random headline
    const pickRandomHeadline = () => {
      const randomIndex = Math.floor(Math.random() * headlines.length)
      const headline = headlines[randomIndex]
      setCurrentHeadline(headline)
      setIsTerminalHint(headline === "this hint actually takes you somewhere")
    }

    // Initial headline
    pickRandomHeadline()

    // Change headline every 8-15 seconds (random interval for variety)
    const interval = setInterval(() => {
      pickRandomHeadline()
    }, Math.random() * 7000 + 8000) // 8-15 seconds

    return () => clearInterval(interval)
  }, [])

  const handleHeadlineClick = () => {
    if (isTerminalHint) {
      router.push('/terminal')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Scrolling Headline */}
      <div className="w-full overflow-hidden bg-muted border-b border-border py-4">
        <div
          className={`whitespace-nowrap font-mono text-sm text-muted-foreground animate-scroll-left ${isTerminalHint ? 'cursor-pointer' : ''}`}
          onClick={handleHeadlineClick}
        >
          {/* Create large gaps by repeating spaces */}
          {currentHeadline}
          {'                                                                                                    '}
          {currentHeadline}
          {'                                                                                                    '}
          {currentHeadline}
        </div>
      </div>

      {/* Header */}
      <header className="border-b border-border sticky top-0 bg-background z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-lg md:text-xl font-mono text-foreground hover:text-primary transition-colors">
            a normal website
          </Link>

          <MobileNav user={user} />
        </div>
      </header>

      {/* Main Content - Empty support page */}
      <main className="container mx-auto px-4 py-6 md:py-8">
        <div className="space-y-4">
          <h1 className="text-3xl md:text-4xl font-mono font-bold text-foreground">
            help & support
          </h1>
        </div>
      </main>

      <style jsx>{`
        @keyframes scroll-left {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.333%);
          }
        }

        .animate-scroll-left {
          animation: scroll-left 60s linear infinite;
        }
      `}</style>
    </div>
  )
}
