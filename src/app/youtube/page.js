'use client'
import { useState } from 'react'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://fret-buddy-api.onrender.com'

export default function YouTubePage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)

  const search = async (e) => {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setError('')
    setSelected(null)
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('fretbuddy_token') : null
      const res = await fetch(`${API_BASE}/api/youtube/search?q=${encodeURIComponent(query)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Search failed')
      setResults(data.results || data.items || data || [])
    } catch (err) {
      setError(err.message)
      // Fallback: show some suggested searches
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const suggestedSearches = [
    'beginner guitar lesson', 'pentatonic scale blues', 'fingerpicking technique',
    'barre chords tutorial', 'guitar theory basics', 'blues licks and riffs',
    'sweep picking lesson', 'acoustic fingerstyle', 'electric guitar tone',
  ]

  return (
    <div className="min-h-screen bg-guitar-hero">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-2 text-center">▶ YouTube Lessons</h1>
        <p className="text-gray-400 text-center mb-8">Search for guitar lessons and tutorials</p>

        {/* Search */}
        <form onSubmit={search} className="flex gap-2 mb-6">
          <input
            type="text"
            placeholder="Search: beginner chords, blues scale, fingerpicking..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-400 transition-colors"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-xl transition-all"
          >
            {loading ? '...' : '🔍'}
          </button>
        </form>

        {/* Suggested searches */}
        {!results.length && !loading && (
          <div className="mb-8">
            <p className="text-gray-400 text-sm mb-3">Suggested searches:</p>
            <div className="flex flex-wrap gap-2">
              {suggestedSearches.map(s => (
                <button
                  key={s}
                  onClick={() => { setQuery(s); }}
                  className="px-3 py-1.5 rounded-full text-sm border border-white/20 text-gray-300 hover:border-orange-400 hover:text-orange-400 transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-500/20 border border-red-500/40 text-red-300 rounded-xl px-4 py-3 mb-6 text-sm">
            {error}
          </div>
        )}

        {/* Video Player */}
        {selected && (
          <div className="mb-8 bg-card rounded-2xl overflow-hidden">
            <div className="aspect-video">
              <iframe
                src={`https://www.youtube.com/embed/${selected.videoId}?autoplay=1`}
                title={selected.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
            <div className="p-4">
              <h3 className="font-bold text-white mb-1">{selected.title}</h3>
              <p className="text-gray-400 text-sm">{selected.channelTitle}</p>
              <button
                onClick={() => setSelected(null)}
                className="text-orange-400 hover:text-orange-300 text-sm mt-2"
              >
                ← Back to results
              </button>
            </div>
          </div>
        )}

        {/* Results grid */}
        {results.length > 0 && !selected && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((video, i) => {
              const videoId = video.videoId || video.id?.videoId || video.id
              const title = video.title || video.snippet?.title || 'Untitled'
              const channel = video.channelTitle || video.snippet?.channelTitle || ''
              const thumbnail = video.thumbnail || video.thumbnails?.medium?.url || video.snippet?.thumbnails?.medium?.url || `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
              return (
                <button
                  key={i}
                  onClick={() => setSelected({ videoId, title, channelTitle: channel })}
                  className="bg-card rounded-xl overflow-hidden text-left hover:-translate-y-1 transition-all group"
                >
                  <div className="relative aspect-video bg-black/40">
                    {thumbnail ? (
                      <img src={thumbnail} alt={title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">▶</div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-4xl">▶</span>
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-medium text-white line-clamp-2 group-hover:text-orange-400 transition-colors">{title}</h3>
                    {channel && <p className="text-xs text-gray-400 mt-1">{channel}</p>}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
