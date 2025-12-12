'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Cloud, CloudRain, CloudSnow, Sun, Wind, Droplets, Eye } from 'lucide-react'

interface WeatherData {
  location: string
  temperature: number
  condition: string
  humidity: number
  windSpeed: number
  forecast: Array<{
    day: string
    high: number
    low: number
    condition: string
  }>
}

export default function HurricanePage() {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [weatherLoading, setWeatherLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAccess = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/signin')
        return
      }

      setUser(user)

      // Check chess_champion status
      const { data: profile } = await supabase
        .from('profiles')
        .select('chess_champion')
        .eq('id', user.id)
        .single()

      if (!profile || !profile.chess_champion) {
        // Redirect to 403 if not chess champion
        router.push('/forbidden')
        return
      }

      // Track page discovery ONLY if chess_champion is true
      await supabase.rpc('record_page_discovery', {
        p_user_id: user.id,
        p_page_key: 'eyeofthehurricane'
      })

      setLoading(false)

      // Fetch weather based on IP
      fetchWeather()
    }

    checkAccess()
  }, [router, supabase])

  const fetchWeather = async () => {
    try {
      // Get user's IP location
      const ipResponse = await fetch('https://ipapi.co/json/')
      const ipData = await ipResponse.json()

      // Fetch weather using Open-Meteo (free, no API key needed)
      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${ipData.latitude}&longitude=${ipData.longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=7`
      )
      const weatherData = await weatherResponse.json()

      // Map weather codes to conditions
      const getCondition = (code: number) => {
        if (code === 0) return 'Clear'
        if (code <= 3) return 'Partly Cloudy'
        if (code <= 48) return 'Foggy'
        if (code <= 67) return 'Rainy'
        if (code <= 77) return 'Snowy'
        if (code <= 82) return 'Showers'
        if (code <= 86) return 'Snow Showers'
        return 'Stormy'
      }

      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      const today = new Date()

      setWeather({
        location: `${ipData.city}, ${ipData.region}`,
        temperature: Math.round(weatherData.current.temperature_2m),
        condition: getCondition(weatherData.current.weather_code),
        humidity: weatherData.current.relative_humidity_2m,
        windSpeed: Math.round(weatherData.current.wind_speed_10m),
        forecast: weatherData.daily.time.slice(1, 7).map((date: string, i: number) => ({
          day: days[(today.getDay() + i + 1) % 7],
          high: Math.round(weatherData.daily.temperature_2m_max[i + 1]),
          low: Math.round(weatherData.daily.temperature_2m_min[i + 1]),
          condition: getCondition(weatherData.daily.weather_code[i + 1])
        }))
      })
      setWeatherLoading(false)
    } catch (error) {
      console.error('Weather fetch error:', error)
      // Fallback weather data
      setWeather({
        location: 'Unknown Location',
        temperature: 72,
        condition: 'Clear',
        humidity: 50,
        windSpeed: 5,
        forecast: []
      })
      setWeatherLoading(false)
    }
  }

  const getWeatherIcon = (condition: string) => {
    const lower = condition.toLowerCase()
    if (lower.includes('clear') || lower.includes('sun')) return <Sun className="w-12 h-12 text-yellow-400" />
    if (lower.includes('rain') || lower.includes('shower')) return <CloudRain className="w-12 h-12 text-blue-400" />
    if (lower.includes('snow')) return <CloudSnow className="w-12 h-12 text-blue-200" />
    if (lower.includes('cloud')) return <Cloud className="w-12 h-12 text-gray-400" />
    if (lower.includes('wind')) return <Wind className="w-12 h-12 text-gray-400" />
    return <Cloud className="w-12 h-12 text-gray-400" />
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-300 to-blue-400 flex items-center justify-center">
        <div className="text-white font-mono">verifying access...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-300 via-blue-300 to-blue-400 relative overflow-hidden">
      {/* Floating clouds */}
      <div className="absolute inset-0 overflow-hidden opacity-30">
        <div className="absolute w-32 h-16 bg-white rounded-full top-[20%] left-[10%] animate-pulse" />
        <div className="absolute w-48 h-20 bg-white rounded-full top-[15%] right-[15%]" />
        <div className="absolute w-40 h-18 bg-white rounded-full top-[60%] left-[20%]" />
        <div className="absolute w-36 h-16 bg-white rounded-full top-[70%] right-[25%] animate-pulse" />
      </div>

      {/* Header */}
      <header className="border-b border-white/20 bg-white/10 backdrop-blur-sm sticky top-0 z-40 relative">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="text-lg font-mono text-white hover:text-blue-100 transition-colors">
            ← return
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 md:py-20 relative">
        <div className="max-w-4xl mx-auto">
          {/* Title Section */}
          <div className="text-center mb-12 space-y-4">
            <div className="inline-block p-4 rounded-full bg-white/20 backdrop-blur-sm mb-4">
              <Eye className="w-16 h-16 text-white" />
            </div>
            <h1 className="text-5xl md:text-7xl font-bold font-mono text-white drop-shadow-lg">
              EYE OF THE HURRICANE
            </h1>
            <p className="text-xl md:text-2xl font-mono text-blue-100">
              calm after the storm
            </p>
          </div>

          {/* Weather Content */}
          {weatherLoading ? (
            <div className="text-center text-white font-mono py-12">
              fetching forecast...
            </div>
          ) : weather ? (
            <div className="space-y-8">
              {/* Current Weather */}
              <div className="bg-white/20 backdrop-blur-md rounded-2xl p-8 border border-white/30 shadow-2xl">
                <div className="text-center space-y-4">
                  <p className="text-2xl font-mono text-white/90">
                    {weather.location}
                  </p>
                  <div className="flex items-center justify-center gap-6">
                    {getWeatherIcon(weather.condition)}
                    <div className="text-7xl font-bold text-white">
                      {weather.temperature}°
                    </div>
                  </div>
                  <p className="text-3xl font-mono text-white/90">
                    {weather.condition}
                  </p>

                  <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/20">
                    <div className="flex items-center justify-center gap-2">
                      <Droplets className="w-5 h-5 text-blue-200" />
                      <span className="font-mono text-white">
                        {weather.humidity}% humidity
                      </span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <Wind className="w-5 h-5 text-blue-200" />
                      <span className="font-mono text-white">
                        {weather.windSpeed} mph wind
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 6-Day Forecast */}
              {weather.forecast.length > 0 && (
                <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6 border border-white/30 shadow-2xl">
                  <h2 className="text-2xl font-mono font-bold text-white mb-6 text-center">
                    6-day forecast
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {weather.forecast.map((day, i) => (
                      <div
                        key={i}
                        className="bg-white/10 rounded-lg p-4 text-center space-y-2"
                      >
                        <p className="font-mono font-bold text-white text-lg">
                          {day.day}
                        </p>
                        <div className="flex justify-center">
                          {getWeatherIcon(day.condition)}
                        </div>
                        <p className="font-mono text-white/80 text-sm">
                          {day.condition}
                        </p>
                        <div className="flex justify-center gap-3 font-mono text-white">
                          <span className="text-lg">{day.high}°</span>
                          <span className="text-white/60">{day.low}°</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Message */}
              <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <p className="font-mono text-white/90 text-lg leading-relaxed">
                  you've conquered the ultimate challenge. here in the eye of the hurricane,
                  all is peaceful. enjoy this moment of tranquility.
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  )
}
