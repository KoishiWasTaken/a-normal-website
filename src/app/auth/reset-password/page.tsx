'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'passwords do not match' })
      return
    }

    if (password.length < 6) {
      setMessage({ type: 'error', text: 'password must be at least 6 characters' })
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({
      password: password
    })

    setLoading(false)

    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setMessage({ type: 'success', text: 'password updated successfully! redirecting...' })
      setTimeout(() => {
        router.push('/')
        router.refresh()
      }, 2000)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-mono">reset password</CardTitle>
          <CardDescription className="font-mono">
            enter your new password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="font-mono">new password</Label>
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
              {loading ? 'updating...' : 'update password'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm font-mono text-muted-foreground">
            <Link href="/" className="text-primary hover:underline">
              back to homepage
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
