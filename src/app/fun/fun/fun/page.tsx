'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function FunPage() {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [showInvitation, setShowInvitation] = useState(false)
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkFunValue = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/signin')
        return
      }

      setUser(user)

      // Track page discovery
      await supabase.rpc('record_page_discovery', {
        p_user_id: user.id,
        p_page_key: 'funfunfun'
      })

      // Check fun value
      const { data: profile } = await supabase
        .from('profiles')
        .select('fun_value')
        .eq('id', user.id)
        .single()

      if (profile && profile.fun_value === 72) {
        setShowInvitation(true)
      }

      setLoading(false)
    }

    checkFunValue()
  }, [router, supabase])

  const handleSubmitCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (inviteCode.toLowerCase() === 'neptune') {
      // Correct code - navigate to deep blue
      router.push('/celestial/deepblue')
    } else {
      setError('invalid invitation code')
      setInviteCode('')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-red-500 font-mono">loading...</div>
      </div>
    )
  }

  if (showInvitation) {
    // Invitation variant (FV=72)
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold text-red-600 font-mono tracking-wider">
              YOU'RE INVITED
            </h1>
            <div className="space-y-2">
              <p className="text-xl text-red-500 font-mono">
                to a fun-filled party
              </p>
              <p className="text-lg text-red-400/80 font-mono">
                where the festivities never end
              </p>
            </div>
          </div>

          <div className="border-t border-b border-red-600/30 py-6 space-y-3">
            <p className="text-red-500 font-mono text-sm">
              location: beyond the ordinary
            </p>
            <p className="text-red-500 font-mono text-sm">
              time: when the stars align
            </p>
            <p className="text-red-500 font-mono text-sm">
              dress code: bring your best game
            </p>
          </div>

          <form onSubmit={handleSubmitCode} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="inviteCode" className="block text-red-400 font-mono text-sm uppercase">
                enter invitation code
              </label>
              <Input
                id="inviteCode"
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="your code here"
                className="bg-black border-red-600/50 text-red-500 placeholder:text-red-900 font-mono text-center"
                required
              />
            </div>

            {error && (
              <div className="text-sm text-red-400 font-mono">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-500 text-black font-mono font-bold"
            >
              RSVP
            </Button>
          </form>

          <p className="text-xs text-red-700 font-mono italic mt-8">
            we hope to see you there
          </p>
        </div>
      </div>
    )
  }

  // Default variant - 6x12 array of red FUN text
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="grid grid-cols-6 gap-4 md:gap-6 lg:gap-8">
        {Array.from({ length: 72 }, (_, i) => (
          <div
            key={i}
            className="text-red-600 font-mono font-bold text-2xl md:text-3xl lg:text-4xl select-none"
          >
            FUN
          </div>
        ))}
      </div>
    </div>
  )
}
