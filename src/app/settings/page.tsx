'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { recordPageDiscovery } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { validatePassword } from '@/lib/validation'
import MobileNav from '@/components/MobileNav'

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

  // Bio state
  const [bio, setBio] = useState('')
  const [bioLoading, setBioLoading] = useState(false)
  const [bioMessage, setBioMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Fun Value state
  const [funValue, setFunValue] = useState(0)
  const [funValueLoading, setFunValueLoading] = useState(false)
  const [funValueMessage, setFunValueMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

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

      // Track page discovery
      await recordPageDiscovery(supabase, user.id, 'settings')

      // Load current bio and fun value
      const { data: profile } = await supabase
        .from('profiles')
        .select('bio, fun_value')
        .eq('id', user.id)
        .single()

      if (profile?.bio) {
        setBio(profile.bio)
      }
      if (profile?.fun_value !== null && profile?.fun_value !== undefined) {
        setFunValue(profile.fun_value)
      }

      setLoading(false)
    }
    getUser()
  }, [router, supabase])

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

  const handleBioUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setBioMessage(null)
    setBioLoading(true)

    if (!user) {
      setBioMessage({ type: 'error', text: 'User not found' })
      setBioLoading(false)
      return
    }

    const { error } = await supabase
      .from('profiles')
      .update({ bio: bio.trim() || null })
      .eq('id', user.id)

    setBioLoading(false)

    if (error) {
      setBioMessage({ type: 'error', text: error.message })
    } else {
      setBioMessage({
        type: 'success',
        text: 'Bio updated successfully!'
      })
    }
  }

  const handleFunValueUpdate = async () => {
    setFunValueMessage(null)
    setFunValueLoading(true)

    if (!user) {
      setFunValueMessage({ type: 'error', text: 'User not found' })
      setFunValueLoading(false)
      return
    }

    const { error } = await supabase
      .from('profiles')
      .update({ fun_value: funValue })
      .eq('id', user.id)

    setFunValueLoading(false)

    if (error) {
      setFunValueMessage({ type: 'error', text: error.message })
    } else {
      setFunValueMessage({
        type: 'success',
        text: 'Fun Value updated!'
      })
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
      <header className="border-b border-border sticky top-0 bg-background z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-lg md:text-xl font-mono text-foreground hover:text-primary transition-colors">
            a normal website
          </Link>

          <MobileNav user={user} />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 md:py-16">
        <div className="max-w-2xl mx-auto space-y-6 md:space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-mono font-bold text-foreground">
              settings
            </h1>
            <p className="text-sm md:text-base text-muted-foreground font-mono">
              manage your account
            </p>
          </div>

          {/* Update Bio */}
          <Card>
            <CardHeader>
              <CardTitle className="font-mono">bio</CardTitle>
              <CardDescription className="font-mono">
                tell others about yourself
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleBioUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bio" className="font-mono">your bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="no bio set"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="font-mono resize-none"
                    maxLength={200}
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground font-mono text-right">
                    {bio.length}/200 characters
                  </p>
                </div>

                {bioMessage && (
                  <div className={`text-sm font-mono p-3 rounded border ${
                    bioMessage.type === 'error'
                      ? 'bg-destructive/10 text-destructive border-destructive/20'
                      : 'bg-primary/10 text-primary border-primary/20'
                  }`}>
                    {bioMessage.text}
                  </div>
                )}

                <Button type="submit" disabled={bioLoading} className="font-mono">
                  {bioLoading ? 'updating...' : 'update bio'}
                </Button>
              </form>
            </CardContent>
          </Card>

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

          {/* Fun Value Slider */}
          <Card>
            <CardHeader>
              <CardTitle className="font-mono">fun value</CardTitle>
              <CardDescription className="font-mono">
                adjust your fun level
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="funValue" className="font-mono">current value</Label>
                    <span className="font-mono text-primary font-bold">{funValue}</span>
                  </div>
                  <input
                    id="funValue"
                    type="range"
                    min="0"
                    max="100"
                    value={funValue}
                    onChange={(e) => setFunValue(Number(e.target.value))}
                    className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground font-mono">
                    <span>0</span>
                    <span>100</span>
                  </div>
                </div>

                {funValueMessage && (
                  <div className={`text-sm font-mono p-3 rounded border ${
                    funValueMessage.type === 'error'
                      ? 'bg-destructive/10 text-destructive border-destructive/20'
                      : 'bg-primary/10 text-primary border-primary/20'
                  }`}>
                    {funValueMessage.text}
                  </div>
                )}

                <Button onClick={handleFunValueUpdate} disabled={funValueLoading} className="font-mono">
                  {funValueLoading ? 'setting...' : 'set'}
                </Button>
              </div>
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
