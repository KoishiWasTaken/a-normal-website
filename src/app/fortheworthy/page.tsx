'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { recordPageDiscovery } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Heart, Sparkles, Clock } from 'lucide-react'

interface Comment {
  id: string
  user_id: string
  username: string
  comment_text: string
  created_at: string
}

export default function ForTheWorthyPage() {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [tracked, setTracked] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [canPost, setCanPost] = useState(true)
  const [nextPostTime, setNextPostTime] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const checkPostCooldown = async (userId: string) => {
    const { data } = await supabase
      .from('worthy_comments')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (data) {
      const lastPost = new Date(data.created_at)
      const now = new Date()
      const hoursSincePost = (now.getTime() - lastPost.getTime()) / (1000 * 60 * 60)

      if (hoursSincePost < 24) {
        setCanPost(false)
        const nextPost = new Date(lastPost.getTime() + 24 * 60 * 60 * 1000)
        setNextPostTime(nextPost.toLocaleString())
      } else {
        setCanPost(true)
        setNextPostTime(null)
      }
    }
  }

  const loadComments = async () => {
    const { data, error } = await supabase
      .from('worthy_comments')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      // Silently fail
    } else {
      setComments(data || [])
    }
  }

  const handlePostComment = async () => {
    if (!user || !newComment.trim() || !canPost) return

    setError(null)
    setSuccess(null)

    const { error: insertError } = await supabase
      .from('worthy_comments')
      .insert({
        user_id: user.id,
        username: user.email?.split('@')[0] || 'anonymous',
        comment_text: newComment.trim(),
        created_at: new Date().toISOString()
      })

    if (insertError) {
      // Silently fail
      setError('Failed to post comment. Please try again.')
    } else {
      setSuccess('Comment posted!')
      setNewComment('')
      setCanPost(false)
      await checkPostCooldown(user.id)
      await loadComments()
      setTimeout(() => setSuccess(null), 3000)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/signin')
        return
      }

      setUser(user)

      // Check if user is authenticated via friendzone (check both methods)
      const { data: authData } = await supabase
        .from('friend_authentications')
        .select('*')
        .eq('user_id', user.id)
        .single()

      // Also check if user has friendzone_verified in profiles (for admin verification)
      const { data: profileData } = await supabase
        .from('profiles')
        .select('friendzone_verified')
        .eq('id', user.id)
        .single()

      // User is authenticated if they have either friend_authentications entry OR friendzone_verified = true
      const isVerified = authData || (profileData?.friendzone_verified === true)

      if (!isVerified) {
        // Not authenticated, redirect to forbidden
        router.push('/forbidden')
        return
      }

      setAuthenticated(true)

      // Track page discovery ONLY if authenticated
      if (!tracked) {
      await recordPageDiscovery(supabase, user.id, 'fortheworthy')
        setTracked(true)
      }

      // Check post cooldown
      await checkPostCooldown(user.id)

      // Load comments
      await loadComments()

      setLoading(false)
    }

    fetchData()
  }, [router, supabase, tracked])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 flex items-center justify-center">
        <div className="text-purple-600 font-mono">loading...</div>
      </div>
    )
  }

  if (!authenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100">
      {/* Header */}
      <header className="border-b border-purple-300 bg-white/50 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-lg md:text-xl font-mono text-purple-600 hover:text-purple-800 transition-colors flex items-center gap-2">
            <Heart className="fill-pink-400 text-pink-400" size={20} />
            a normal website
          </Link>
          <Link href="/archive">
            <Button variant="outline" className="font-mono border-purple-400 text-purple-600 hover:bg-purple-100">
              archive
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 md:py-16">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Title */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <Sparkles className="text-yellow-400" size={32} />
              <h1 className="text-4xl md:text-5xl font-mono font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                for the worthy
              </h1>
              <Sparkles className="text-yellow-400" size={32} />
            </div>
            <p className="text-lg md:text-xl text-purple-700 font-mono">
              a space for friends ♡
            </p>
          </div>

          {/* Welcome Card */}
          <Card className="border-2 border-purple-300 bg-white/70 backdrop-blur">
            <CardContent className="pt-6 text-center">
              <p className="text-sm md:text-base font-mono text-purple-700 leading-relaxed">
                welcome to the exclusive corner of the internet. <br />
                you made it here because someone thought you were special. <br />
                leave your mark, share your thoughts, spread the love. ♡
              </p>
            </CardContent>
          </Card>

          {/* Post Comment */}
          <Card className="border-2 border-pink-300 bg-white/70 backdrop-blur">
            <CardHeader>
              <CardTitle className="font-mono text-purple-600 flex items-center gap-2">
                <Heart className="fill-pink-400 text-pink-400" size={20} />
                leave a comment
              </CardTitle>
              <CardDescription className="font-mono text-purple-600">
                {canPost
                  ? 'share your thoughts with fellow worthy ones'
                  : 'you can post again in 24 hours'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {canPost ? (
                <>
                  <div className="space-y-2">
                    <Label className="font-mono text-purple-700">your message</Label>
                    <Textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="say something nice..."
                      className="font-mono border-2 border-purple-300 min-h-[120px] resize-none"
                      maxLength={500}
                    />
                    <p className="text-xs text-purple-500 font-mono text-right">
                      {newComment.length}/500
                    </p>
                  </div>

                  <Button
                    onClick={handlePostComment}
                    disabled={!newComment.trim()}
                    className="w-full font-mono bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white disabled:opacity-50"
                  >
                    post comment ♡
                  </Button>
                </>
              ) : (
                <div className="text-center py-6 space-y-2">
                  <Clock className="mx-auto text-purple-400" size={32} />
                  <p className="text-sm font-mono text-purple-600">
                    cooldown active
                  </p>
                  {nextPostTime && (
                    <p className="text-xs font-mono text-purple-500">
                      next post available: {nextPostTime}
                    </p>
                  )}
                </div>
              )}

              {error && (
                <div className="p-3 border-2 border-red-400 bg-red-50 rounded">
                  <p className="text-sm text-red-600 font-mono text-center">
                    {error}
                  </p>
                </div>
              )}

              {success && (
                <div className="p-3 border-2 border-green-400 bg-green-50 rounded">
                  <p className="text-sm text-green-600 font-mono text-center">
                    {success}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Comments Board */}
          <div className="space-y-4">
            <h2 className="text-2xl font-mono font-bold text-purple-600">
              comment board
            </h2>

            {comments.length === 0 ? (
              <Card className="border-2 border-purple-200 bg-white/50">
                <CardContent className="py-12 text-center">
                  <p className="text-purple-500 font-mono">
                    no comments yet. be the first to leave one! ♡
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {comments.map((comment) => (
                  <Card key={comment.id} className="border-2 border-purple-200 bg-white/70 backdrop-blur hover:border-purple-300 transition-colors">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-sm font-mono text-purple-700">
                          {comment.username}
                        </CardTitle>
                        <CardDescription className="text-xs font-mono text-purple-500">
                          {formatDate(comment.created_at)}
                        </CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm font-mono text-purple-900 leading-relaxed whitespace-pre-wrap">
                        {comment.comment_text}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
