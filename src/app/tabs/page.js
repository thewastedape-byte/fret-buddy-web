'use client'
import { useState } from 'react'

const TABS_DB = [
  {
    id: 1,
    title: 'Smoke on the Water',
    artist: 'Deep Purple',
    genre: 'Rock',
    difficulty: 'Beginner',
    bpm: 112,
    tuning: 'Standard',
    tab: `e|------------------------------------------------|
B|------------------------------------------------|
G|-5-3-5-6------5-3-6-5---5-3-5-6-3-5------------|
D|-5-3-5-6------5-3-6-5---5-3-5-6-3-5------------|
A|------------------------------------------------|
E|------------------------------------------------|

Chords: Gm - Bb - C
Tempo: 112 BPM`,
    notes: 'One of the most famous guitar riffs of all time. The riff is played on the D and G strings together.',
  },
  {
    id: 2,
    title: 'Wonderful Tonight',
    artist: 'Eric Clapton',
    genre: 'Blues Rock',
    difficulty: 'Beginner',
    bpm: 96,
    tuning: 'Standard',
    tab: `e|--0-0-0-0----0-0-0-------0---0---0-0-0---------|
B|--1-1-1-1----1-1-1-------1---1---1-1-1---------|
G|--0-0-0-0----2-2-0-------0---0---0-0-0---------|
D|--2-2-2-2----3-3-2-------2---2---2-2-2---------|
A|--3-3-3-3----3-3-3-------3---3---3-3-3---------|
E|------------------------------------------------|

Chord Progression: G - D - C - D`,
    notes: 'Beautiful ballad with clean tone. Focus on smooth chord transitions.',
  },
  {
    id: 3,
    title: 'Sweet Home Chicago',
    artist: 'Robert Johnson',
    genre: 'Blues',
    difficulty: 'Intermediate',
    bpm: 90,
    tuning: 'Standard',
    tab: `e|--0-----0-3--0-----0------0-1-0-----0-3---------|
B|--0--1--0----0--1--0------0---0--1--0-----------|
G|--0-----0----0-----0------0---0-----0-----------|
D|------------------------------------------------|
A|------------------------------------------------|
E|------------------------------------------------|

E7 - A7 - B7 Blues Shuffle
12-bar blues in E`,
    notes: 'Classic Chicago blues shuffle. Learn the 12-bar blues pattern.',
  },
  {
    id: 4,
    title: 'Enter Sandman (Intro)',
    artist: 'Metallica',
    genre: 'Metal',
    difficulty: 'Intermediate',
    bpm: 122,
    tuning: 'Drop D',
    tab: `e|------------------------------------------------|
B|------------------------------------------------|
G|------------------------------------------------|
D|------------------------------------------------|
A|--0--0--0--3--0--5--4--3--0--3--0--7--0---------|
E|--0--0--0--3--0--5--4--3--0--3--0--7--0---------|

Main Riff - Drop D Tuning
Power chords throughout`,
    notes: 'Drop D tuning required. Classic metal rhythm riff.',
  },
  {
    id: 5,
    title: 'Stairway to Heaven (Intro)',
    artist: 'Led Zeppelin',
    genre: 'Classic Rock',
    difficulty: 'Intermediate',
    bpm: 72,
    tuning: 'Standard',
    tab: `e|--7--5--5--5----5--7--5--7--5--8--7----5---------|
B|--5--5--5--5----5--5--5--5--5--5--5----5---------|
G|--5--5--5--5----5--5--5--5--5--5--5----5---------|
D|--7--7--7--7----5--7--7--7--5--7--7----5---------|
A|-------------------------------------------------|
E|-------------------------------------------------|

Am - G/B - C intro fingerpicking`,
    notes: 'One of the greatest guitar intros. Focus on fingerpicking technique.',
  },
  {
    id: 6,
    title: 'Purple Haze',
    artist: 'Jimi Hendrix',
    genre: 'Psychedelic Rock',
    difficulty: 'Intermediate',
    bpm: 108,
    tuning: 'Eb (half step down)',
    tab: `e|------------------------------------------------|
B|------------------------------------------------|
G|--8-8-8-8-8-8-----------------------------------| 
D|--7-7-7-7-7-7-7-9-7-9--9-9-------------------9--|
A|--5-5-5-5-5-5-5-7-5-7--7-7-------------------7--|
E|------------------------------------------------|

E7#9 "Hendrix Chord"
Classic psychedelic riff`,
    notes: 'Hendrix tuned his guitar half-step down. The E7#9 chord is the "Hendrix chord".',
  },
  {
    id: 7,
    title: 'Blackbird',
    artist: 'The Beatles',
    genre: 'Folk Rock',
    difficulty: 'Advanced',
    bpm: 100,
    tuning: 'Standard',
    tab: `e|-------5-------3-------2-------0-----0---------|
B|-----5---5---3---3---3---3---1---1---0---------|
G|---4-------2-------2-------0-------------0-----|
D|-0-----------0-----------2-----------2---------|
A|------------------------------------------------|
E|------------------------------------------------|

Fingerpicking pattern - Travis picking
G - Am - G/B - G`,
    notes: 'Beautiful fingerpicking piece. Practice the thumb pattern separately first.',
  },
  {
    id: 8,
    title: 'Sweet Child O\' Mine',
    artist: "Guns N' Roses",
    genre: 'Hard Rock',
    difficulty: 'Advanced',
    bpm: 125,
    tuning: 'Standard',
    tab: `e|--12-12-15-12-15-12-17-15--12-12-15-12-15-12----|
B|------------------------------------------------|
G|------------------------------------------------|
D|------------------------------------------------|
A|------------------------------------------------|
E|------------------------------------------------|

Famous intro riff - single string
D - C - G - D progression`,
    notes: 'Slash\'s iconic intro. The riff is played on just the high E string.',
  },
  {
    id: 9,
    title: 'Texas Flood',
    artist: 'Stevie Ray Vaughan',
    genre: 'Blues',
    difficulty: 'Advanced',
    bpm: 50,
    tuning: 'Eb (half step down)',
    tab: `e|--10b12-10--8--10b12--10-8--10--8--10b12--------|
B|------------------------------------------------|
G|------------------------------------------------|
D|------------------------------------------------|
A|------------------------------------------------|
E|------------------------------------------------|

Slow blues in G minor
SRV style bending and vibrato`,
    notes: 'SRV classic. Tune down half step. Focus on tone, bends, and vibrato.',
  },
  {
    id: 10,
    title: 'House of the Rising Sun',
    artist: 'The Animals',
    genre: 'Folk',
    difficulty: 'Beginner',
    bpm: 78,
    tuning: 'Standard',
    tab: `e|----0-----0-----0-----2-----3-----0-----2-----1--|
B|--1-----0-----1-----3-----0-----1-----1-----1----|
G|----2-----0-----2-----2-----0-----2-----2-----2--|
D|-2-----2-----0-----0-----2-----2-----2-----2-----|
A|------------------------------------------------|
E|------------------------------------------------|

Am - C - D - F - Am - C - E - E
Arpeggiated picking pattern`,
    notes: 'Classic folk arpeggio pattern. 6/8 feel. Great for fingerpicking practice.',
  },
]

export default function TabsPage() {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [filter, setFilter] = useState('All')

  const genres = ['All', ...new Set(TABS_DB.map(t => t.genre))]
  const difficulties = ['All', 'Beginner', 'Intermediate', 'Advanced']
  const [diffFilter, setDiffFilter] = useState('All')

  const filtered = TABS_DB.filter(t => {
    const q = search.toLowerCase()
    const matchSearch = !search || t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q) || t.genre.toLowerCase().includes(q)
    const matchGenre = filter === 'All' || t.genre === filter
    const matchDiff = diffFilter === 'All' || t.difficulty === diffFilter
    return matchSearch && matchGenre && matchDiff
  })

  const diffColor = {
    'Beginner': 'text-green-400 bg-green-400/10',
    'Intermediate': 'text-yellow-400 bg-yellow-400/10',
    'Advanced': 'text-red-400 bg-red-400/10',
  }

  return (
    <div className="min-h-screen bg-guitar-hero">
      {selected ? (
        /* Tab detail view */
        <div className="max-w-3xl mx-auto px-4 py-8">
          <button
            onClick={() => setSelected(null)}
            className="text-orange-400 hover:text-orange-300 mb-6 flex items-center gap-2 text-sm"
          >
            ← Back to list
          </button>
          <div className="bg-card rounded-2xl p-6">
            <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
              <div>
                <h1 className="text-2xl font-bold text-white">{selected.title}</h1>
                <p className="text-orange-400">{selected.artist}</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${diffColor[selected.difficulty]}`}>{selected.difficulty}</span>
                <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-gray-300">{selected.genre}</span>
                <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-gray-300">♩ {selected.bpm} BPM</span>
                <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-gray-300">🎸 {selected.tuning}</span>
              </div>
            </div>
            
            {selected.notes && (
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg px-4 py-3 mb-4 text-sm text-orange-200">
                💡 {selected.notes}
              </div>
            )}

            <div className="bg-black/40 rounded-xl p-4 overflow-x-auto">
              <pre className="tab-notation text-green-300 whitespace-pre text-xs md:text-sm leading-relaxed">
                {selected.tab}
              </pre>
            </div>
          </div>
        </div>
      ) : (
        /* Tab list view */
        <div className="max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-white mb-2 text-center">🎵 Guitar Tabs</h1>
          <p className="text-gray-400 text-center mb-8">Classic songs with full notation</p>

          {/* Search */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search songs, artists..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-400 transition-colors"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-6">
            <div className="flex gap-1 flex-wrap">
              {difficulties.map(d => (
                <button
                  key={d}
                  onClick={() => setDiffFilter(d)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    diffFilter === d ? 'bg-orange-500 text-white' : 'border border-white/20 text-gray-400 hover:text-white'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Tab list */}
          <div className="space-y-3">
            {filtered.map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelected(tab)}
                className="w-full bg-card rounded-xl p-4 text-left hover:border-orange-500/30 hover:-translate-y-0.5 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-white group-hover:text-orange-400 transition-colors">{tab.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${diffColor[tab.difficulty]}`}>{tab.difficulty}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
                      <span>{tab.artist}</span>
                      <span>•</span>
                      <span>{tab.genre}</span>
                      <span>•</span>
                      <span>♩ {tab.bpm}</span>
                      <span>•</span>
                      <span>{tab.tuning}</span>
                    </div>
                  </div>
                  <span className="text-gray-500 group-hover:text-orange-400 transition-colors ml-3">→</span>
                </div>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-12 text-gray-500">No tabs found</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
