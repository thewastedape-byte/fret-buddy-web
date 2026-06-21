'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

const navLinks = [
  { href: '/lesson', label: '🎸 Lesson', key: 'lesson' },
  { href: '/metronome', label: '⏱ Metro', key: 'metro' },
  { href: '/tabs', label: '🎵 Tabs', key: 'tabs' },
  { href: '/theory', label: '📖 Theory', key: 'theory' },
  { href: '/youtube', label: '▶ YouTube', key: 'yt' },
  { href: '/tuner', label: '🎼 Tuner', key: 'tuner' },
  { href: '/pricing', label: '💳 Plans', key: 'pricing' },
]

export default function Nav() {
  const pathname = usePathname()
  const [user, setUser] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('fretbuddy_user')
    if (stored) {
      try { setUser(JSON.parse(stored)) } catch {}
    }
    const handler = () => {
      const u = localStorage.getItem('fretbuddy_user')
      setUser(u ? JSON.parse(u) : null)
    }
    window.addEventListener('fretbuddy_auth', handler)
    return () => window.removeEventListener('fretbuddy_auth', handler)
  }, [])

  const logout = () => {
    localStorage.removeItem('fretbuddy_token')
    localStorage.removeItem('fretbuddy_user')
    setUser(null)
    window.location.href = '/'
  }

  return (
    <nav className="bg-black/80 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
        {/* Logo */}
        <Link href="/" className="text-xl font-bold text-orange-400 hover:text-orange-300 transition-colors flex items-center gap-2">
          <span>🎸</span>
          <span>Fret Buddy</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(l => (
            <Link
              key={l.key}
              href={l.href}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                pathname === l.href
                  ? 'bg-orange-500/20 text-orange-400'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* Auth */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link href="/profile" className="text-sm text-gray-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/10 transition-all hidden md:block">
                👤 {user.name || user.email?.split('@')[0]}
              </Link>
              <button onClick={logout} className="text-sm text-gray-400 hover:text-red-400 px-2 py-1 transition-colors hidden md:block">
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm text-gray-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/10 transition-all hidden md:block">
                Log In
              </Link>
              <Link href="/signup" className="text-sm bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg font-medium transition-all hidden md:block">
                Sign Up
              </Link>
            </>
          )}

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-gray-300 hover:text-white p-2"
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-black/95 border-t border-white/10 px-4 py-3 flex flex-col gap-1">
          {navLinks.map(l => (
            <Link
              key={l.key}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                pathname === l.href
                  ? 'bg-orange-500/20 text-orange-400'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              {l.label}
            </Link>
          ))}
          <div className="border-t border-white/10 mt-2 pt-2 flex gap-2">
            {user ? (
              <>
                <Link href="/profile" onClick={() => setMenuOpen(false)} className="flex-1 text-center text-sm text-gray-300 hover:text-white px-3 py-2 rounded-lg hover:bg-white/10 transition-all">
                  👤 Profile
                </Link>
                <button onClick={logout} className="flex-1 text-center text-sm text-red-400 hover:text-red-300 px-3 py-2 rounded-lg hover:bg-white/10 transition-all">
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setMenuOpen(false)} className="flex-1 text-center text-sm text-gray-300 hover:text-white px-3 py-2 rounded-lg hover:bg-white/10 transition-all">
                  Log In
                </Link>
                <Link href="/signup" onClick={() => setMenuOpen(false)} className="flex-1 text-center text-sm bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-lg font-medium transition-all">
                  Sign Up Free
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
