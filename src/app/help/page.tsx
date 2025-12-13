'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { recordPageDiscovery } from '@/lib/utils'
import { useRouter } from 'next/navigation'

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
  const [headlineSequence, setHeadlineSequence] = useState<Array<{ text: string; isLink: boolean }>>([])
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
    // Generate a sequence of random headlines
    const generateSequence = () => {
      const sequence = []
      for (let i = 0; i < 10; i++) {
        const randomIndex = Math.floor(Math.random() * headlines.length)
        const headline = headlines[randomIndex]
        sequence.push({
          text: headline,
          isLink: headline === "this hint actually takes you somewhere"
        })
      }
      return sequence
    }

    // Initial sequence
    setHeadlineSequence(generateSequence())

    // Regenerate sequence every 50-80 seconds
    const interval = setInterval(() => {
      setHeadlineSequence(generateSequence())
    }, Math.random() * 30000 + 50000)

    return () => clearInterval(interval)
  }, [])

  const handleHeadlineClick = (isLink: boolean) => {
    if (isLink) {
      router.push('/terminal')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Scrolling Headline */}
      <div className="w-full overflow-hidden bg-muted border-b border-border py-4">
        <div className="whitespace-nowrap font-mono text-sm text-muted-foreground animate-scroll-seamless inline-block">
          {/* First copy */}
          {headlineSequence.map((item, index) => (
            <span key={`first-${index}`} className="inline-block">
              <span
                className={`inline-block ${item.isLink ? 'cursor-pointer' : ''}`}
                onClick={() => handleHeadlineClick(item.isLink)}
              >
                {item.text}
              </span>
              <span className="inline-block" style={{ width: '600px' }}></span>
            </span>
          ))}
          {/* Second copy for seamless loop */}
          {headlineSequence.map((item, index) => (
            <span key={`second-${index}`} className="inline-block">
              <span
                className={`inline-block ${item.isLink ? 'cursor-pointer' : ''}`}
                onClick={() => handleHeadlineClick(item.isLink)}
              >
                {item.text}
              </span>
              <span className="inline-block" style={{ width: '600px' }}></span>
            </span>
          ))}
        </div>
      </div>

      {/* Main Content - Empty support page with centered header */}
      <main className="flex items-center justify-center min-h-[calc(100vh-60px)]">
        <h1 className="text-3xl md:text-4xl font-mono font-bold text-foreground text-center">
          help & support :)
        </h1>
      </main>

      <style jsx>{`
        @keyframes scroll-seamless {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .animate-scroll-seamless {
          animation: scroll-seamless 40s linear infinite;
        }
      `}</style>
    </div>
  )
}
