'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const supabase = createClient()

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    setLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    setLoading(false)

    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setMessage({
        type: 'success',
        text: 'check your email for a password reset link. you may need to check your spam folder.'
      })
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <Link href="/auth/signin" className="text-sm text-muted-foreground hover:text-primary font-mono">
            ← back to sign in
          </Link>
          <CardTitle className="text-2xl font-mono">forgot password</CardTitle>
          <CardDescription className="font-mono">
            enter your email to receive a password reset link
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResetPassword} className="space-y-4">
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
              {loading ? 'sending...' : 'send reset link'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm font-mono text-muted-foreground">
            remember your password?{' '}
            <Link href="/auth/signin" className="text-primary hover:underline">
              sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
