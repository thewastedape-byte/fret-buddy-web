'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'

const skillLevels = [
  { value: 'beginner', label: '🌱 Beginner — Just starting out' },
  { value: 'intermediate', label: '🎸 Intermediate — Know some chords' },
  { value: 'advanced', label: '⚡ Advanced — Playing for years' },
]

export default function SignupPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '', name: '', skill_level: 'beginner' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    try {
      const data = await api.auth.register(form)
      localStorage.setItem('fretbuddy_token', data.token)
      localStorage.setItem('fretbuddy_user', JSON.stringify(data.user))
      window.dispatchEvent(new Event('fretbuddy_auth'))
      router.push('/lesson')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-guitar-hero">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🎸</div>
          <h1 className="text-3xl font-bold text-white">Start learning free</h1>
          <p className="text-gray-400 mt-2">5 AI lessons per day, no credit card needed</p>
        </div>

        <div className="bg-card rounded-2xl p-8">
          {error && (
            <div className="bg-red-500/20 border border-red-500/40 text-red-300 rounded-lg px-4 py-3 mb-4 text-sm">
              {error}
            </div>
          )}
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Name</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-400 transition-colors"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-400 transition-colors"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
              <input
                type="password"
                required
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-400 transition-colors"
                placeholder="Min 6 characters"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Skill Level</label>
              <select
                value={form.skill_level}
                onChange={e => setForm({ ...form, skill_level: e.target.value })}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-400 transition-colors"
              >
                {skillLevels.map(s => (
                  <option key={s.value} value={s.value} className="bg-gray-900">{s.label}</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all mt-2"
            >
              {loading ? 'Creating account...' : 'Create Free Account 🎸'}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-400 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-orange-400 hover:text-orange-300 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
