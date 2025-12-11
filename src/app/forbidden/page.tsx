'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ShieldX } from 'lucide-react'

export default function ForbiddenPage() {
  const [tracked, setTracked] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const trackDiscovery = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (user && !tracked) {
        // Track page discovery
        await supabase.rpc('record_page_discovery', {
          p_user_id: user.id,
          p_page_key: '403'
        })
        setTracked(true)
      }
    }

    trackDiscovery()
  }, [supabase, tracked])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full border-destructive/20">
        <CardContent className="pt-8 pb-8 md:pt-12 md:pb-12 text-center space-y-4 md:space-y-6">
          <div className="flex justify-center">
            <ShieldX size={48} className="md:w-16 md:h-16 text-destructive opacity-50" />
          </div>

          <div className="space-y-2">
            <h1 className="text-5xl md:text-6xl font-mono font-bold text-foreground">
              403
            </h1>
            <h2 className="text-xl md:text-2xl font-mono text-muted-foreground">
              access forbidden
            </h2>
          </div>

          <div className="space-y-3 md:space-y-4 pt-2 md:pt-4">
            <p className="text-sm md:text-base text-foreground font-mono leading-relaxed">
              you're not supposed to be here.
            </p>
            <p className="text-xs md:text-sm text-muted-foreground font-mono">
              this area is restricted. you don't have permission to access this.
            </p>
            <p className="text-xs text-muted-foreground/50 font-mono italic">
              ...yet.
            </p>
          </div>

          <div className="pt-4 md:pt-6 flex flex-col sm:flex-row gap-3 sm:gap-3 justify-center">
            <Link href="/" className="w-full sm:w-auto">
              <Button className="font-mono w-full sm:w-auto">
                return home
              </Button>
            </Link>
            <Link href="/archive" className="w-full sm:w-auto">
              <Button variant="outline" className="font-mono w-full sm:w-auto">
                check archive
              </Button>
            </Link>
          </div>

          <div className="pt-6 md:pt-8 text-xs text-muted-foreground/30 font-mono">
            error code: 403_FORBIDDEN
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
