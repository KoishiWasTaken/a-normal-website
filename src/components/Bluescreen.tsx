'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function Bluescreen() {
  const [keyBuffer, setKeyBuffer] = useState('')
  const [showRecovery, setShowRecovery] = useState(false)
  const [soundPlayed, setSoundPlayed] = useState(false)
  const [percentage, setPercentage] = useState(0)
  const router = useRouter()
  const incrementTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const specialTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Erratic percentage progression
  useEffect(() => {
    const scheduleNext = () => {
      setPercentage(prev => {
        if (prev >= 99) {
          return prev
        }

        // Erratic increment between 1-7%
        const increment = Math.floor(Math.random() * 7) + 1
        const newValue = Math.min(prev + increment, 99)

        // Schedule next increment with random delay (200-800ms)
        const delay = Math.floor(Math.random() * 600) + 200
        incrementTimeoutRef.current = setTimeout(scheduleNext, delay)

        return newValue
      })
    }

    // Start the progression after a short delay
    incrementTimeoutRef.current = setTimeout(scheduleNext, 500)

    return () => {
      if (incrementTimeoutRef.current) {
        clearTimeout(incrementTimeoutRef.current)
      }
    }
  }, [])

  // Handle 99% pause and 100% redirect
  useEffect(() => {
    if (percentage === 99) {
      specialTimeoutRef.current = setTimeout(() => {
        setPercentage(100)
      }, 2500)
    } else if (percentage === 100) {
      specialTimeoutRef.current = setTimeout(() => {
        router.push('/')
      }, 1000)
    }

    return () => {
      if (specialTimeoutRef.current) {
        clearTimeout(specialTimeoutRef.current)
      }
    }
  }, [percentage, router])

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const newBuffer = (keyBuffer + e.key.toLowerCase()).slice(-6) // Keep last 6 chars
      setKeyBuffer(newBuffer)

      if (newBuffer === 'uranus' && !showRecovery) {
        // Play sound effect
        if (!soundPlayed) {
          // Create a simple beep sound using Web Audio API
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
          const oscillator = audioContext.createOscillator()
          const gainNode = audioContext.createGain()

          oscillator.connect(gainNode)
          gainNode.connect(audioContext.destination)

          oscillator.frequency.value = 800
          oscillator.type = 'sine'

          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

          oscillator.start(audioContext.currentTime)
          oscillator.stop(audioContext.currentTime + 0.5)

          setSoundPlayed(true)
        }

        setShowRecovery(true)
      }
    }

    window.addEventListener('keypress', handleKeyPress)
    return () => window.removeEventListener('keypress', handleKeyPress)
  }, [keyBuffer, showRecovery, soundPlayed])

  const handleRecovery = () => {
    router.push('/zlepuzazapl')
  }

  return (
    <div className="fixed inset-0 bg-[#0078d7] flex items-center justify-center z-50 font-mono">
      <div className="max-w-3xl w-full px-8">
        {/* Sad Face */}
        <div className="text-white text-8xl mb-8">:(</div>

        {/* Main Message */}
        <div className="text-white space-y-6">
          <p className="text-2xl font-bold">
            Your PC ran into a problem and needs to restart. We're just
            collecting some error info, and then we'll restart for you.
          </p>

          <p className="text-xl opacity-90">
            <span className="inline-block min-w-[60px]">{percentage}%</span> complete
          </p>

          <div className="pt-8 space-y-2 text-sm opacity-75">
            <p>
              If you'd like to know more, you can search online later for this error:
            </p>
            <p className="font-bold">CRITICAL_STRUCTURE_CORRUPTION</p>
          </div>
        </div>

        {/* Recovery Button (hidden until "uranus" is typed) */}
        {showRecovery && (
          <div className="mt-12 animate-fadeIn">
            <button
              onClick={handleRecovery}
              className="bg-white text-[#0078d7] px-6 py-3 font-bold hover:bg-gray-200 transition-colors border-2 border-white shadow-lg"
            >
              Attempt Recovery
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </div>
  )
}
