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
  const [isTerminating, setIsTerminating] = useState(false)
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

  const processCommand = async (command: string): Promise<string[]> => {
    const cmd = command.trim().toLowerCase()
    const parts = cmd.split(/\s+/)
    const baseCmd = parts[0]

    // Process termination commands → redirect to homepage
    const terminateCommands = ['kill', 'killall', 'pkill', 'shutdown', 'reboot', 'halt', 'poweroff', 'init', 'systemctl']
    if (terminateCommands.includes(baseCmd) || cmd.includes('kill -9') || cmd.includes('sudo shutdown') || cmd.includes('sudo reboot')) {
      setIsTerminating(true)
      setTimeout(() => {
        router.push('/')
      }, 2000)
      return ['terminating process...']
    }

    // Destructive commands → access denied
    const destructiveCommands = ['rm', 'rmdir', 'mkfs', 'dd', 'fdisk', 'parted', 'wipefs', 'shred', 'format']
    if (destructiveCommands.includes(baseCmd) && (cmd.includes('-rf') || cmd.includes('-r') || cmd.includes('--force') || cmd.includes('/') || cmd.includes('*'))) {
      return ['access denied.']
    }
    if (baseCmd === 'chmod' && (cmd.includes('777') || cmd.includes('000'))) {
      return ['access denied.']
    }
    if (baseCmd === 'chown' || baseCmd === 'chgrp') {
      return ['access denied.']
    }

    // Data recovery command (special case - keep original behavior)
    if (command.trim() === 'tar -xvpzf /backup/page.tsx -C /src/app/zlepuzazapl') {
      if (user) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('data_recovered')
          .eq('id', user.id)
          .maybeSingle()

        if (error) {
          return ['error: could not verify recovery status.']
        } else if (profile && profile.data_recovered === true) {
          return ['data has already been recovered.']
        } else {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ data_recovered: true })
            .eq('id', user.id)

          if (updateError) {
            return ['error: recovery failed.']
          } else {
            return ['data successfully recovered.']
          }
        }
      }
    }

    // Common Linux commands with generic responses
    switch (baseCmd) {
      case 'ls':
      case 'dir':
        return ['archive/', 'help/', 'terminal/', 'zlepuzazapl/']

      case 'pwd':
        return ['/home/user']

      case 'whoami':
        return ['user']

      case 'date':
        return [new Date().toString().toLowerCase()]

      case 'uptime':
        return ['system uptime: unknown']

      case 'uname':
        return ['linux']

      case 'hostname':
        return ['anormalwebsite']

      case 'echo':
        return [parts.slice(1).join(' ')]

      case 'cat':
        if (parts[1]) {
          return [`cat: ${parts[1]}: no such file or directory`]
        }
        return ['']

      case 'touch':
        return ['access denied.']

      case 'mkdir':
        return ['access denied.']

      case 'cd':
        return ['']

      case 'clear':
      case 'cls':
        setLines([])
        return []

      case 'help':
      case 'man':
        return [
          'available commands:',
          '  ls, pwd, whoami, date, echo, cat, cd, clear',
          '  help - show this message',
          '  exit - return to homepage'
        ]

      case 'exit':
      case 'quit':
        router.push('/')
        return ['goodbye.']

      case 'sudo':
        if (parts[1]) {
          return ['access denied.']
        }
        return ['sudo: command not found']

      case 'top':
      case 'htop':
        return ['permission denied.']

      case 'ps':
        return ['  pid tty          time cmd', '    1 pts/0    00:00:00 bash']

      case 'df':
        return ['filesystem      size  used avail use% mounted on', '/dev/sda1       100g   42g   58g  42% /']

      case 'free':
        return ['              total        used        free      shared  buff/cache   available', 'mem:       16384000     8192000     8192000           0           0     8192000']

      case 'history':
        return lines
          .filter(l => l.type === 'input')
          .map((l, i) => `  ${i + 1}  ${l.content}`)

      case 'wget':
      case 'curl':
        return ['command not found']

      case 'nano':
      case 'vi':
      case 'vim':
      case 'emacs':
        return ['text editor not available in web terminal.']

      case 'git':
        return ['git: command not found']

      case 'python':
      case 'python3':
      case 'node':
      case 'npm':
      case 'java':
        return [`${baseCmd}: command not found`]

      case 'ping':
        return ['ping: socket: operation not permitted']

      case 'ifconfig':
      case 'ip':
        return ['command requires elevated privileges.']

      case 'find':
        return ['find: paths must precede expression']

      case 'grep':
        return ['usage: grep [options] pattern [files]']

      case 'tar':
        if (cmd !== 'tar -xvpzf /backup/page.tsx -c /src/app/zlepuzazapl') {
          return ['tar: invalid option or missing operands']
        }
        return ['input unrecognized.']

      case 'ssh':
        return ['ssh: connect to host failed: connection refused']

      case 'su':
        return ['access denied.']

      case 'passwd':
        return ['access denied.']

      case 'mount':
      case 'umount':
        return ['access denied.']

      case 'service':
      case 'systemd':
        return ['access denied.']

      default:
        return ['input unrecognized.']
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentInput.trim() || isTerminating) return

    // Add input line
    const newLines: TerminalLine[] = [
      ...lines,
      { type: 'input', content: currentInput }
    ]

    // Process command
    const outputLines = await processCommand(currentInput)

    // Add output lines
    outputLines.forEach(line => {
      newLines.push({ type: 'output', content: line })
    })

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
