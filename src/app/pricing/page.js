'use client'
import { useState } from 'react'
import Link from 'next/link'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://fret-buddy-api.onrender.com'

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    priceDisplay: '$0',
    period: '/mo',
    color: 'border-gray-600',
    highlight: false,
    features: [
      '5 AI lessons per day',
      'Chromatic tuner',
      'Metronome',
      'Basic tabs (10 songs)',
      'Music theory reference',
      'YouTube search',
    ],
    notIncluded: ['Camera hand analysis', 'Voice conversation', 'Progress tracking'],
    cta: 'Start Free',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 9.99,
    priceDisplay: '$9.99',
    period: '/mo',
    color: 'border-orange-500',
    highlight: true,
    features: [
      'Unlimited AI lessons',
      '📸 Camera hand position analysis',
      '🎤 Voice conversation',
      'Full tab library',
      'Progress tracking',
      'Session history',
      'Priority AI responses',
      'All free features',
    ],
    notIncluded: [],
    cta: 'Go Pro',
    priceId: 'price_pro',
  },
  {
    id: 'master',
    name: 'Master',
    price: 24.99,
    priceDisplay: '$24.99',
    period: '/mo',
    color: 'border-purple-500',
    highlight: false,
    features: [
      'Everything in Pro',
      '🎯 Custom lesson plans',
      '📚 Advanced theory modules',
      '🎵 Backing tracks',
      '🎙 Session recording',
      '⚡ Fastest AI responses',
      '👑 VIP support',
    ],
    notIncluded: [],
    cta: 'Go Master',
    priceId: 'price_master',
  },
]

const faqs = [
  { q: 'Can I cancel anytime?', a: 'Yes, cancel anytime. Your access continues until the end of the billing period.' },
  { q: 'Do I need a guitar to start?', a: 'You can use Fret Buddy for theory, tabs, and YouTube lessons without a guitar. Camera analysis and tuner require one!' },
  { q: 'What camera do I need?', a: 'Any built-in or USB webcam works. The AI will analyze your hand position and posture from the video feed.' },
  { q: 'Is there a free trial for Pro?', a: 'The free plan gives you 5 lessons/day to try the AI teacher. Upgrade when you\'re ready for unlimited access.' },
  { q: 'What payment methods do you accept?', a: 'All major credit/debit cards via Stripe. Secure checkout.' },
]

export default function PricingPage() {
  const [loading, setLoading] = useState(null)
  const [error, setError] = useState('')

  const handleCheckout = async (plan) => {
    if (plan.id === 'free') {
      window.location.href = '/signup'
      return
    }
    setLoading(plan.id)
    setError('')
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('fretbuddy_token') : null
      if (!token) {
        window.location.href = '/signup'
        return
      }
      const res = await fetch(`${API_BASE}/api/stripe/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plan: plan.id, priceId: plan.priceId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Checkout failed')
      if (data.url) window.location.href = data.url
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-guitar-hero">
      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
            Simple, Honest Pricing
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Start free, upgrade when you're ready. No surprise charges.
          </p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/40 text-red-300 rounded-xl px-4 py-3 mb-6 text-center">
            {error}
          </div>
        )}

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-card rounded-2xl p-8 border-2 ${plan.color} ${
                plan.highlight ? 'shadow-xl shadow-orange-500/20 md:scale-105' : ''
              } transition-all`}
            >
              {plan.highlight && (
                <div className="text-center mb-4">
                  <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                    Most Popular
                  </span>
                </div>
              )}

              <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
              <div className="flex items-end gap-1 mb-6">
                <span className="text-5xl font-extrabold text-white">{plan.priceDisplay}</span>
                <span className="text-gray-400 pb-2">{plan.period}</span>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-gray-300 text-sm">
                    <span className="text-green-400 mt-0.5 flex-shrink-0">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
                {plan.notIncluded.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-gray-600 text-sm line-through">
                    <span className="mt-0.5 flex-shrink-0">✕</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleCheckout(plan)}
                disabled={loading === plan.id}
                className={`w-full py-3.5 rounded-xl font-bold text-base transition-all ${
                  plan.highlight
                    ? 'bg-orange-500 hover:bg-orange-600 text-white glow-orange'
                    : plan.id === 'master'
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'border border-white/20 hover:border-orange-400 text-white hover:text-orange-400'
                } disabled:opacity-50`}
              >
                {loading === plan.id ? 'Loading...' : plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-card rounded-xl p-5">
                <h3 className="font-semibold text-white mb-2">{faq.q}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="text-gray-400 mb-4">Already have an account?</p>
          <Link href="/login" className="text-orange-400 hover:text-orange-300 font-medium underline">
            Sign in →
          </Link>
        </div>
      </div>
    </div>
  )
}
