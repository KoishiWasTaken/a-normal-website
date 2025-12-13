'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { recordPageDiscovery } from '@/lib/utils'
import { useRouter } from 'next/navigation'

interface TerminalLine {
  type: 'input' | 'output'
  content: string
}

export default function TerminalPage() {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [lines, setLines] = useState<TerminalLine[]>([])
  const [currentInput, setCurrentInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const terminalRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/signin')
        return
      }

      setUser(user)
      await recordPageDiscovery(supabase, user.id, 'terminal')
    }

    init()
  }, [router, supabase])

  useEffect(() => {
    // Focus input on mount and whenever clicked
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    // Scroll to bottom when new lines are added
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [lines])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentInput.trim()) return

    // Add input line
    const newLines: TerminalLine[] = [
      ...lines,
      { type: 'input', content: currentInput }
    ]

    // Process command
    const command = currentInput.trim()

    // Data recovery command
    if (command === 'tar -xvpzf /backup/page.tsx -C /src/app/zlepuzazapl') {
      if (user) {
        // Check if already recovered
        const { data: profile } = await supabase
          .from('profiles')
          .select('data_recovered')
          .eq('user_id', user.id)
          .single()

        if (profile?.data_recovered) {
          newLines.push({ type: 'output', content: 'Data has already been recovered.' })
        } else {
          // Set data_recovered to true
          await supabase
            .from('profiles')
            .update({ data_recovered: true })
            .eq('user_id', user.id)

          newLines.push({ type: 'output', content: 'Data successfully recovered.' })
        }
      }
    } else {
      newLines.push({ type: 'output', content: 'input unrecognized.' })
    }

    setLines(newLines)
    setCurrentInput('')
  }

  const handleTerminalClick = () => {
    inputRef.current?.focus()
  }

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono p-0 m-0 overflow-hidden">
      <div
        ref={terminalRef}
        className="h-screen w-screen p-4 overflow-y-auto cursor-text"
        onClick={handleTerminalClick}
      >
        {/* Previous lines */}
        {lines.map((line, index) => (
          <div key={index} className="mb-1">
            {line.type === 'input' ? (
              <div>
                <span className="text-green-500">{'>'}</span> {line.content}
              </div>
            ) : (
              <div className="text-green-400/80 ml-2">{line.content}</div>
            )}
          </div>
        ))}

        {/* Current input line */}
        <form onSubmit={handleSubmit} className="flex items-center">
          <span className="text-green-500 mr-1">{'>'}</span>
          <input
            ref={inputRef}
            type="text"
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            className="flex-1 bg-transparent outline-none border-none text-green-400 caret-green-400"
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
          />
          <span className="animate-blink ml-0.5">▊</span>
        </form>
      </div>

      <style jsx>{`
        @keyframes blink {
          0%, 50% {
            opacity: 1;
          }
          51%, 100% {
            opacity: 0;
          }
        }

        .animate-blink {
          animation: blink 1s step-end infinite;
        }
      `}</style>
    </div>
  )
}
