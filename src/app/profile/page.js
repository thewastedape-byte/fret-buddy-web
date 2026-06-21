'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://fret-buddy-api.onrender.com'

const SKILL_LEVELS = ['beginner', 'intermediate', 'advanced']
const SKILL_LABELS = { beginner: '🌱 Beginner', intermediate: '🎸 Intermediate', advanced: '⚡ Advanced' }

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editName, setEditName] = useState('')
  const [editSkill, setEditSkill] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('fretbuddy_token')
    const stored = localStorage.getItem('fretbuddy_user')
    if (!token) {
      router.push('/login')
      return
    }
    if (stored) {
      const u = JSON.parse(stored)
      setUser(u)
      setEditName(u.name || '')
      setEditSkill(u.skill_level || 'beginner')
    }
    // Fetch fresh data
    fetch(`${API_BASE}/api/user/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        if (data.user || data.id) {
          const u = data.user || data
          setUser(u)
          setEditName(u.name || '')
          setEditSkill(u.skill_level || 'beginner')
          localStorage.setItem('fretbuddy_user', JSON.stringify(u))
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [router])

  const save = async () => {
    setSaving(true)
    try {
      const token = localStorage.getItem('fretbuddy_token')
      const res = await fetch(`${API_BASE}/api/user/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: editName, skill_level: editSkill }),
      })
      const data = await res.json()
      if (res.ok) {
        const u = data.user || data
        setUser(u)
        localStorage.setItem('fretbuddy_user', JSON.stringify(u))
        window.dispatchEvent(new Event('fretbuddy_auth'))
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } catch {}
    setSaving(false)
  }

  const logout = () => {
    localStorage.removeItem('fretbuddy_token')
    localStorage.removeItem('fretbuddy_user')
    window.dispatchEvent(new Event('fretbuddy_auth'))
    router.push('/')
  }

  const subColor = {
    'free': 'text-gray-400 bg-gray-400/10 border-gray-500',
    'pro': 'text-orange-400 bg-orange-400/10 border-orange-500',
    'master': 'text-purple-400 bg-purple-400/10 border-purple-500',
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-guitar-hero flex items-center justify-center">
        <div className="text-gray-400">Loading profile...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-guitar-hero flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-white mb-4">Please sign in to view your profile</h2>
          <Link href="/login" className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl transition-all">
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-guitar-hero">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">👤 Your Profile</h1>

        {/* Subscription status */}
        <div className={`bg-card rounded-2xl p-6 mb-6 border-2 ${subColor[user.subscription || 'free']}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Current Plan</p>
              <p className={`text-2xl font-extrabold capitalize ${subColor[user.subscription || 'free'].split(' ')[0]}`}>
                {user.subscription === 'pro' ? '⚡ Pro' : user.subscription === 'master' ? '👑 Master' : '🆓 Free'}
              </p>
            </div>
            {user.subscription === 'free' && (
              <Link href="/pricing" className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2 rounded-xl text-sm transition-all">
                Upgrade
              </Link>
            )}
          </div>
        </div>

        {/* Profile info */}
        <div className="bg-card rounded-2xl p-6 mb-6">
          <h2 className="font-bold text-white mb-4">Account Details</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Name</label>
              <input
                type="text"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-400 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
              <input
                type="email"
                value={user.email || ''}
                disabled
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-gray-400 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Skill Level</label>
              <select
                value={editSkill}
                onChange={e => setEditSkill(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-400 transition-colors"
              >
                {SKILL_LEVELS.map(s => (
                  <option key={s} value={s} className="bg-gray-900">{SKILL_LABELS[s]}</option>
                ))}
              </select>
            </div>

            <button
              onClick={save}
              disabled={saving}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all"
            >
              {saved ? '✓ Saved!' : saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-card rounded-2xl p-6 mb-6">
          <h2 className="font-bold text-white mb-4">📊 Progress</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-3xl font-extrabold text-orange-400">{user.lessons_today || 0}</div>
              <div className="text-xs text-gray-400">Lessons Today</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-orange-400">{user.total_lessons || 0}</div>
              <div className="text-xs text-gray-400">Total Lessons</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-orange-400 capitalize">{user.skill_level || 'beginner'}</div>
              <div className="text-xs text-gray-400">Skill Level</div>
            </div>
          </div>
        </div>

        {/* Quick links */}
        <div className="bg-card rounded-2xl p-6 mb-6">
          <h2 className="font-bold text-white mb-4">Quick Links</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { href: '/lesson', label: '🎸 Start a Lesson' },
              { href: '/metronome', label: '⏱ Metronome' },
              { href: '/tabs', label: '🎵 Browse Tabs' },
              { href: '/theory', label: '📖 Music Theory' },
              { href: '/tuner', label: '🎼 Tuner' },
              { href: '/youtube', label: '▶ YouTube' },
            ].map(l => (
              <Link key={l.href} href={l.href} className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-orange-500/30 rounded-xl px-4 py-3 text-sm text-gray-300 hover:text-white transition-all text-center">
                {l.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="w-full border border-red-500/30 text-red-400 hover:bg-red-500/10 font-medium py-3 rounded-xl transition-all"
        >
          Sign Out
        </button>
      </div>
    </div>
  )
}
