import Link from 'next/link'

const features = [
  { icon: '📸', title: 'Camera Analysis', desc: 'AI watches your hand position and technique in real-time via your webcam' },
  { icon: '🎤', title: 'Voice Lessons', desc: 'Hold the mic and talk to your AI teacher — ask questions, get feedback' },
  { icon: '▶', title: 'YouTube Integration', desc: 'Find the perfect lesson video for any song, technique, or concept' },
  { icon: '⏱', title: 'Smart Metronome', desc: 'Visual metronome with tap tempo, BPM slider, and multiple time signatures' },
  { icon: '🎵', title: 'Guitar Tabs', desc: '10+ classic songs with full notation, chords, and BPM info' },
  { icon: '📖', title: 'Music Theory', desc: 'Scales, chords, progressions, circle of fifths — interactive and visual' },
  { icon: '🎼', title: 'Chromatic Tuner', desc: 'Web Audio API pitch detection — tune up before every session' },
  { icon: '📊', title: 'Progress Tracking', desc: 'Track your skill level, lesson history, and subscription tier' },
]

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: '/mo',
    color: 'border-gray-600',
    highlight: false,
    features: ['5 AI lessons per day', 'Metronome & tuner', 'Basic tabs (10 songs)', 'Music theory reference', 'YouTube search'],
    cta: 'Start Free',
    href: '/signup',
  },
  {
    name: 'Pro',
    price: '$9.99',
    period: '/mo',
    color: 'border-orange-500',
    highlight: true,
    features: ['Unlimited AI lessons', 'Camera hand analysis', 'Voice conversation', 'Full tab library', 'Progress tracking', 'Priority responses'],
    cta: 'Go Pro',
    href: '/pricing',
  },
  {
    name: 'Master',
    price: '$24.99',
    period: '/mo',
    color: 'border-purple-500',
    highlight: false,
    features: ['Everything in Pro', 'Custom lesson plans', 'Advanced theory modules', 'Backing tracks', 'Session recording', 'VIP support'],
    cta: 'Go Master',
    href: '/pricing',
  },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-guitar-hero">
      {/* Hero */}
      <section className="relative overflow-hidden py-24 px-4 text-center">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-orange-900/20 pointer-events-none" />
        
        {/* Guitar strings decoration */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute left-0 right-0 h-px opacity-10"
              style={{ top: `${15 + i * 14}%`, background: `linear-gradient(90deg, transparent, #f97316, transparent)` }}
            />
          ))}
        </div>

        <div className="relative max-w-4xl mx-auto">
          <div className="text-7xl mb-6">🎸</div>
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 bg-gradient-to-r from-orange-400 via-yellow-400 to-orange-400 bg-clip-text text-transparent leading-tight">
            Your AI Guitar Teacher
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-4 max-w-2xl mx-auto">
            Always watching. Always listening. Always teaching.
          </p>
          <p className="text-gray-400 mb-10 max-w-xl mx-auto">
            Fret Buddy uses AI vision and voice to give you real-time feedback on your technique — like having a pro guitarist in the room with you.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/signup"
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-4 rounded-xl text-lg transition-all glow-orange hover:scale-105"
            >
              Get Started Free 🎸
            </Link>
            <Link
              href="/lesson"
              className="border border-white/20 hover:border-orange-400 text-white hover:text-orange-400 font-semibold px-8 py-4 rounded-xl text-lg transition-all"
            >
              Try a Lesson
            </Link>
          </div>
          <p className="text-gray-500 text-sm mt-4">No credit card needed • 5 free lessons per day</p>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-3">
            Everything you need to <span className="text-orange-400">shred</span>
          </h2>
          <p className="text-gray-400 text-center mb-12">All the tools, powered by AI</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <div key={i} className="bg-card rounded-xl p-6 hover:border-orange-500/30 transition-all hover:-translate-y-1">
                <div className="text-4xl mb-3">{f.icon}</div>
                <h3 className="font-bold text-white mb-2">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 bg-black/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-12">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { num: '1', icon: '📷', title: 'Point your camera', desc: 'Aim your webcam at your hands and guitar' },
              { num: '2', icon: '🎤', title: 'Ask or play', desc: 'Hold the mic to ask a question, or just start playing' },
              { num: '3', icon: '🤖', title: 'Get feedback', desc: 'AI teacher gives real-time visual and voice feedback' },
            ].map((s, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-2xl mb-4">
                  {s.icon}
                </div>
                <h3 className="font-bold text-white mb-2">{s.title}</h3>
                <p className="text-gray-400 text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-4" id="pricing">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-3">Simple pricing</h2>
          <p className="text-gray-400 text-center mb-12">Start free, upgrade when you're ready</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan, i) => (
              <div
                key={i}
                className={`bg-card rounded-2xl p-8 border-2 ${plan.color} ${plan.highlight ? 'scale-105 shadow-xl shadow-orange-500/20' : ''} transition-all hover:-translate-y-1`}
              >
                {plan.highlight && (
                  <div className="text-center mb-3">
                    <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">MOST POPULAR</span>
                  </div>
                )}
                <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                <div className="flex items-end gap-1 mb-6">
                  <span className="text-4xl font-extrabold text-white">{plan.price}</span>
                  <span className="text-gray-400 pb-1">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-gray-300 text-sm">
                      <span className="text-green-400">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={`block text-center font-bold py-3 rounded-xl transition-all ${
                    plan.highlight
                      ? 'bg-orange-500 hover:bg-orange-600 text-white'
                      : 'border border-white/20 hover:border-orange-400 hover:text-orange-400 text-white'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to play?</h2>
          <p className="text-gray-400 mb-8">Join thousands of guitarists learning with AI</p>
          <Link
            href="/signup"
            className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-bold px-10 py-5 rounded-xl text-xl transition-all glow-orange hover:scale-105"
          >
            Start Your First Lesson →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-4 text-center text-gray-500 text-sm">
        <p>© 2026 Fret Buddy · <Link href="/pricing" className="hover:text-orange-400">Pricing</Link> · <a href="mailto:support@fretbuddy.ai" className="hover:text-orange-400">Support</a></p>
      </footer>
    </div>
  )
}
