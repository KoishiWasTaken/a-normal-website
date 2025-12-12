'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function SignInPage() {
  const [emailOrUsername, setEmailOrUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    console.log('🔐 Attempting sign in...')

    let email = emailOrUsername

    // Check if input is a username (not an email)
    if (!emailOrUsername.includes('@')) {
      // Look up email by username
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .eq('username', emailOrUsername)
        .single()

      if (profileError || !profile || !profile.email) {
        setLoading(false)
        setError('Invalid username or password')
        return
      }

      email = profile.email
    }

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    console.log('Sign in response:', { data, error: signInError })

    setLoading(false)

    if (signInError) {
      console.error('❌ Sign in error:', signInError)
      setError(signInError.message)
    } else if (data.user) {
      // Check if email is verified
      if (!data.user.email_confirmed_at) {
        console.log('❌ Email not verified')
        await supabase.auth.signOut()
        setError('Please verify your email before signing in. Check your inbox for the verification link.')
        return
      }

      console.log('✅ Sign in successful! User:', data.user.email)
      console.log('Session:', data.session)
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <Link href="/" className="text-sm text-muted-foreground hover:text-primary font-mono">
            ← back
          </Link>
          <CardTitle className="text-2xl font-mono">sign in</CardTitle>
          <CardDescription className="font-mono">
            welcome back to a normal website
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="emailOrUsername" className="font-mono">username or email</Label>
              <Input
                id="emailOrUsername"
                type="text"
                placeholder="username or email"
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                required
                className="font-mono"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="font-mono">password</Label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs text-muted-foreground hover:text-primary font-mono"
                >
                  forgot?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="font-mono"
              />
            </div>

            {error && (
              <div className="text-sm font-mono p-3 rounded border bg-destructive/10 text-destructive border-destructive/20">
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full font-mono">
              {loading ? 'signing in...' : 'sign in'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm font-mono text-muted-foreground">
            don&apos;t have an account?{' '}
            <Link href="/auth/signup" className="text-primary hover:underline">
              sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
