'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Copy, Check, Sparkles } from 'lucide-react'

export default function FriendzPage() {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [tracked, setTracked] = useState(false)
  const [friendCode, setFriendCode] = useState<string>('')
  const [inputCode, setInputCode] = useState<string>('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let code = ''
    for (let i = 0; i < 16; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }

  const handleGenerateCode = async () => {
    if (!user) return

    const newCode = generateCode()

    // Save to database
    const { error } = await supabase
      .from('friend_codes')
      .upsert({
        user_id: user.id,
        code: newCode,
        is_used: false,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })

    if (error) {
      console.error('Error saving friend code:', error)
      setError('Failed to generate code. Please try again.')
    } else {
      setFriendCode(newCode)
      setSuccess('New friend code generated!')
      setTimeout(() => setSuccess(null), 3000)
    }
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(friendCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSubmitCode = async () => {
    if (!user || !inputCode.trim()) return

    setError(null)
    setSuccess(null)

    // Check if the code exists and is not used
    const { data: codeData, error: codeError } = await supabase
      .from('friend_codes')
      .select('user_id, is_used')
      .eq('code', inputCode.trim())
      .single()

    if (codeError || !codeData) {
      setError('Invalid friend code.')
      return
    }

    if (codeData.is_used) {
      setError('This friend code has already been used.')
      return
    }

    if (codeData.user_id === user.id) {
      setError('You cannot use your own friend code.')
      return
    }

    // Mark the code as used
    const { error: updateError } = await supabase
      .from('friend_codes')
      .update({ is_used: true })
      .eq('code', inputCode.trim())

    if (updateError) {
      console.error('Error updating friend code:', updateError)
      setError('Failed to use code. Please try again.')
      return
    }

    // Mark user as authenticated
    const { error: authError } = await supabase
      .from('friend_authentications')
      .insert({
        user_id: user.id,
        authenticated_at: new Date().toISOString()
      })

    if (authError) {
      console.error('Error authenticating user:', authError)
      setError('Failed to authenticate. Please try again.')
      return
    }

    setIsAuthenticated(true)
    setSuccess('You are now worthy!')
  }

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/signin')
        return
      }

      setUser(user)

      // Track page discovery
      if (!tracked) {
        await supabase.rpc('record_page_discovery', {
          p_user_id: user.id,
          p_page_key: 'friendzone'
        })
        setTracked(true)
      }

      // Check if user is already authenticated
      const { data: authData } = await supabase
        .from('friend_authentications')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (authData) {
        setIsAuthenticated(true)
      }

      // Load user's friend code if exists
      const { data: codeData } = await supabase
        .from('friend_codes')
        .select('code')
        .eq('user_id', user.id)
        .single()

      if (codeData) {
        setFriendCode(codeData.code)
      } else {
        // Generate initial code
        const newCode = generateCode()
        const { error } = await supabase
          .from('friend_codes')
          .insert({
            user_id: user.id,
            code: newCode,
            is_used: false,
            created_at: new Date().toISOString()
          })

        if (!error) {
          setFriendCode(newCode)
        }
      }

      setLoading(false)
    }

    fetchData()
  }, [router, supabase, tracked])

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-black font-mono">loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-black">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-lg md:text-xl font-mono text-black hover:text-gray-700 transition-colors">
            a normal website
          </Link>
          <Link href="/archive">
            <Button variant="outline" className="font-mono border-black text-black hover:bg-black hover:text-white">
              archive
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 md:py-16">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Title */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-mono font-bold text-black">
              friendzone
            </h1>
            <p className="text-lg md:text-xl text-gray-700 font-mono">
              connections matter
            </p>
          </div>

          {/* Friend Code Generator */}
          <Card className="border-2 border-black">
            <CardHeader>
              <CardTitle className="font-mono text-black">your friend code</CardTitle>
              <CardDescription className="font-mono text-gray-600">
                share this code with someone special
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="font-mono text-black">code</Label>
                <div className="flex gap-2">
                  <Input
                    value={friendCode}
                    readOnly
                    className="font-mono text-lg border-2 border-black bg-gray-50"
                  />
                  <Button
                    onClick={handleCopyCode}
                    variant="outline"
                    className="border-2 border-black hover:bg-black hover:text-white"
                  >
                    {copied ? <Check size={20} /> : <Copy size={20} />}
                  </Button>
                </div>
              </div>

              <Button
                onClick={handleGenerateCode}
                className="w-full font-mono bg-black hover:bg-gray-800 text-white"
              >
                regenerate code
              </Button>

              <p className="text-xs text-gray-500 font-mono text-center">
                once someone uses your code, you'll need to regenerate it for others
              </p>
            </CardContent>
          </Card>

          {/* Friend Code Input */}
          <Card className={`border-2 ${isAuthenticated ? 'border-green-500 bg-green-50' : 'border-black'}`}>
            <CardHeader>
              <CardTitle className="font-mono text-black flex items-center gap-2">
                {isAuthenticated && <Sparkles className="text-green-500" size={20} />}
                authenticate
                {isAuthenticated && <Sparkles className="text-green-500" size={20} />}
              </CardTitle>
              <CardDescription className="font-mono text-gray-600">
                {isAuthenticated
                  ? 'you are worthy'
                  : 'enter a friend code to unlock something special'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isAuthenticated ? (
                <div className="text-center py-8">
                  <p className="text-2xl font-mono font-bold text-green-600 mb-4">
                    ✓ authenticated
                  </p>
                  <p className="text-sm font-mono text-gray-600">
                    you now have access to exclusive areas
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label className="font-mono text-black">friend code</Label>
                    <Input
                      value={inputCode}
                      onChange={(e) => setInputCode(e.target.value)}
                      placeholder="enter 16-character code"
                      className="font-mono border-2 border-black"
                      maxLength={16}
                    />
                  </div>

                  <Button
                    onClick={handleSubmitCode}
                    disabled={inputCode.length !== 16}
                    className="w-full font-mono bg-black hover:bg-gray-800 text-white disabled:opacity-50"
                  >
                    submit code
                  </Button>
                </>
              )}

              {error && (
                <div className="p-3 border-2 border-red-500 bg-red-50 rounded">
                  <p className="text-sm text-red-600 font-mono text-center">
                    {error}
                  </p>
                </div>
              )}

              {success && (
                <div className="p-3 border-2 border-green-500 bg-green-50 rounded">
                  <p className="text-sm text-green-600 font-mono text-center">
                    {success}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
