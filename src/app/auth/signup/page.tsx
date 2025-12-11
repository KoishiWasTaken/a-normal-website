'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { validateUsername, validatePassword } from '@/lib/validation'

export default function SignUpPage() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    // Validate username
    const usernameValidation = validateUsername(username)
    if (!usernameValidation.valid) {
      setMessage({ type: 'error', text: usernameValidation.error || 'Invalid username' })
      return
    }

    // Validate password
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      setMessage({ type: 'error', text: passwordValidation.error || 'Invalid password' })
      return
    }

    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'passwords do not match' })
      return
    }

    setLoading(true)

    // Check if username is already taken
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username)
      .single()

    if (existingUser) {
      setLoading(false)
      setMessage({ type: 'error', text: 'username is already taken' })
      return
    }

    // Sign up with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          username: username,
        }
      },
    })

    if (error) {
      setLoading(false)
      setMessage({ type: 'error', text: error.message })
      return
    }

    // Update profile with username
    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ username: username })
        .eq('id', data.user.id)

      if (profileError) {
        console.error('Error setting username:', profileError)
      }
    }

    setLoading(false)
    setMessage({
      type: 'success',
      text: 'check your email for a verification link. you may need to check your spam folder.'
    })
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <Link href="/" className="text-sm text-muted-foreground hover:text-primary font-mono">
            ← back
          </Link>
          <CardTitle className="text-2xl font-mono">create account</CardTitle>
          <CardDescription className="font-mono">
            sign up to track your discoveries
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="font-mono">username</Label>
              <Input
                id="username"
                type="text"
                placeholder="3-16 characters"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="font-mono"
                minLength={3}
                maxLength={16}
              />
              <p className="text-xs text-muted-foreground font-mono">
                letters, numbers, dashes, underscores only
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="font-mono">email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="font-mono">password</Label>
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

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="font-mono">confirm password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="font-mono"
              />
            </div>

            {message && (
              <div className={`text-sm font-mono p-3 rounded border ${
                message.type === 'error'
                  ? 'bg-destructive/10 text-destructive border-destructive/20'
                  : 'bg-primary/10 text-primary border-primary/20'
              }`}>
                {message.text}
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full font-mono">
              {loading ? 'creating account...' : 'sign up'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm font-mono text-muted-foreground">
            already have an account?{' '}
            <Link href="/auth/signin" className="text-primary hover:underline">
              sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
