'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { validatePassword } from '@/lib/validation'

export default function SettingsPage() {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [loading, setLoading] = useState(true)

  // Email change state
  const [newEmail, setNewEmail] = useState('')
  const [emailPassword, setEmailPassword] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailMessage, setEmailMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/signin')
        return
      }
      setUser(user)
      setLoading(false)
    }
    getUser()
  }, [router, supabase.auth])

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmailMessage(null)
    setEmailLoading(true)

    // Verify current password
    if (!user?.email) {
      setEmailMessage({ type: 'error', text: 'User email not found' })
      setEmailLoading(false)
      return
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: emailPassword,
    })

    if (signInError) {
      setEmailMessage({ type: 'error', text: 'Incorrect password' })
      setEmailLoading(false)
      return
    }

    // Update email
    const { error } = await supabase.auth.updateUser({ email: newEmail })

    setEmailLoading(false)

    if (error) {
      setEmailMessage({ type: 'error', text: error.message })
    } else {
      setEmailMessage({
        type: 'success',
        text: 'Verification email sent to new address. Check your inbox to confirm the change.'
      })
      setNewEmail('')
      setEmailPassword('')
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordMessage(null)

    // Validate new password
    const passwordValidation = validatePassword(newPassword)
    if (!passwordValidation.valid) {
      setPasswordMessage({ type: 'error', text: passwordValidation.error || 'Invalid password' })
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Passwords do not match' })
      return
    }

    setPasswordLoading(true)

    // Verify current password
    if (!user?.email) {
      setPasswordMessage({ type: 'error', text: 'User email not found' })
      setPasswordLoading(false)
      return
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    })

    if (signInError) {
      setPasswordMessage({ type: 'error', text: 'Current password is incorrect' })
      setPasswordLoading(false)
      return
    }

    // Update password
    const { error } = await supabase.auth.updateUser({ password: newPassword })

    setPasswordLoading(false)

    if (error) {
      setPasswordMessage({ type: 'error', text: error.message })
    } else {
      setPasswordMessage({
        type: 'success',
        text: 'Password updated successfully!'
      })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground font-mono">loading...</div>
      </div>
    )
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
            <Link href="/index">
              <Button variant="ghost" className="font-mono">
                index
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
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-mono font-bold text-foreground">
              settings
            </h1>
            <p className="text-muted-foreground font-mono">
              manage your account
            </p>
          </div>

          {/* Change Email */}
          <Card>
            <CardHeader>
              <CardTitle className="font-mono">change email</CardTitle>
              <CardDescription className="font-mono">
                requires password verification
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEmailChange} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentEmail" className="font-mono">current email</Label>
                  <Input
                    id="currentEmail"
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="font-mono bg-muted"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newEmail" className="font-mono">new email</Label>
                  <Input
                    id="newEmail"
                    type="email"
                    placeholder="new@example.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                    className="font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emailPassword" className="font-mono">password</Label>
                  <Input
                    id="emailPassword"
                    type="password"
                    placeholder="verify with your password"
                    value={emailPassword}
                    onChange={(e) => setEmailPassword(e.target.value)}
                    required
                    className="font-mono"
                  />
                </div>

                {emailMessage && (
                  <div className={`text-sm font-mono p-3 rounded border ${
                    emailMessage.type === 'error'
                      ? 'bg-destructive/10 text-destructive border-destructive/20'
                      : 'bg-primary/10 text-primary border-primary/20'
                  }`}>
                    {emailMessage.text}
                  </div>
                )}

                <Button type="submit" disabled={emailLoading} className="font-mono">
                  {emailLoading ? 'updating...' : 'change email'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card>
            <CardHeader>
              <CardTitle className="font-mono">change password</CardTitle>
              <CardDescription className="font-mono">
                must verify current password
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword" className="font-mono">current password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="font-mono">new password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="8-24 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="font-mono"
                    minLength={8}
                    maxLength={24}
                  />
                  <p className="text-xs text-muted-foreground font-mono">
                    alphanumeric + common symbols allowed
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="font-mono">confirm new password</Label>
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

                {passwordMessage && (
                  <div className={`text-sm font-mono p-3 rounded border ${
                    passwordMessage.type === 'error'
                      ? 'bg-destructive/10 text-destructive border-destructive/20'
                      : 'bg-primary/10 text-primary border-primary/20'
                  }`}>
                    {passwordMessage.text}
                  </div>
                )}

                <Button type="submit" disabled={passwordLoading} className="font-mono">
                  {passwordLoading ? 'updating...' : 'change password'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="text-center">
            <Link href="/profile">
              <Button variant="ghost" className="font-mono">
                ← back to profile
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
