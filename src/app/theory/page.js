'use client'
import { useState } from 'react'

// Circle of fifths data
const CIRCLE_NOTES = [
  { note: 'C', major: 'C', minor: 'Am', angle: 90 },
  { note: 'G', major: 'G', minor: 'Em', angle: 30 },
  { note: 'D', major: 'D', minor: 'Bm', angle: -30 },
  { note: 'A', major: 'A', minor: 'F#m', angle: -90 },
  { note: 'E', major: 'E', minor: 'C#m', angle: -150 },
  { note: 'B', major: 'B', minor: 'G#m', angle: -210 },
  { note: 'F#/Gb', major: 'F#', minor: 'Ebm', angle: -270 },
  { note: 'Db', major: 'Db', minor: 'Bbm', angle: 210 },
  { note: 'Ab', major: 'Ab', minor: 'Fm', angle: 150 },
  { note: 'Eb', major: 'Eb', minor: 'Cm', angle: 90, inner: true },
  { note: 'Bb', major: 'Bb', minor: 'Gm', angle: 30, inner: true },
  { note: 'F', major: 'F', minor: 'Dm', angle: 150 },
]

const SCALES = {
  'Major (Ionian)': { intervals: [2,2,1,2,2,2,1], description: 'Happy, bright, triumphant', example: 'C D E F G A B' },
  'Natural Minor': { intervals: [2,1,2,2,1,2,2], description: 'Sad, dark, emotional', example: 'A B C D E F G' },
  'Pentatonic Major': { intervals: [2,2,3,2,3], description: 'Country, folk, rock solos', example: 'C D E G A' },
  'Pentatonic Minor': { intervals: [3,2,2,3,2], description: 'Blues, rock, metal solos', example: 'A C D E G' },
  'Blues Scale': { intervals: [3,2,1,1,3,2], description: 'Blues, jazz, soulful solos', example: 'A C D D# E G' },
  'Dorian Mode': { intervals: [2,1,2,2,2,1,2], description: 'Jazz, funk, soul, minor with raised 6th', example: 'D E F G A B C' },
  'Mixolydian': { intervals: [2,2,1,2,2,1,2], description: 'Rock, blues, dominant feel', example: 'G A B C D E F' },
}

const CHORDS = {
  'Major': { formula: '1 3 5', sound: 'Happy, stable', example: 'C-E-G' },
  'Minor': { formula: '1 b3 5', sound: 'Sad, emotional', example: 'C-Eb-G' },
  'Dominant 7th': { formula: '1 3 5 b7', sound: 'Bluesy, tense', example: 'C-E-G-Bb' },
  'Major 7th': { formula: '1 3 5 7', sound: 'Dreamy, jazzy', example: 'C-E-G-B' },
  'Minor 7th': { formula: '1 b3 5 b7', sound: 'Jazzy, mellow', example: 'C-Eb-G-Bb' },
  'Sus2': { formula: '1 2 5', sound: 'Open, floating', example: 'C-D-G' },
  'Sus4': { formula: '1 4 5', sound: 'Anticipation, tense', example: 'C-F-G' },
  'Diminished': { formula: '1 b3 b5', sound: 'Tense, scary', example: 'C-Eb-Gb' },
  'Augmented': { formula: '1 3 #5', sound: 'Eerie, unresolved', example: 'C-E-G#' },
  'Power Chord': { formula: '1 5', sound: 'Heavy, raw', example: 'C-G' },
}

const PROGRESSIONS = [
  { name: 'I-IV-V (The Classic)', chords: 'I - IV - V', example: 'C - F - G', genres: 'Blues, Country, Rock', description: 'The backbone of rock and blues. Found in thousands of songs.' },
  { name: 'I-V-vi-IV (The Axis)', chords: 'I - V - vi - IV', example: 'C - G - Am - F', genres: 'Pop, Rock', description: 'Used in countless pop songs. Sometimes called the "four-chord song".' },
  { name: 'ii-V-I (Jazz)', chords: 'ii - V - I', example: 'Dm7 - G7 - CMaj7', genres: 'Jazz, Bossa Nova', description: 'The most common jazz progression. Creates tension and release.' },
  { name: 'I-vi-IV-V (50s)', chords: 'I - vi - IV - V', example: 'C - Am - F - G', genres: '50s Rock, Pop', description: 'The classic 50s doo-wop progression.' },
  { name: 'i-VII-VI-VII (Minor)', chords: 'i - VII - VI - VII', example: 'Am - G - F - G', genres: 'Rock, Pop', description: 'Common minor key progression with a driving feel.' },
  { name: '12-Bar Blues', chords: 'I7-I7-I7-I7 / IV7-IV7-I7-I7 / V7-IV7-I7-V7', example: 'E7-A7-B7', genres: 'Blues, Rock', description: 'THE blues progression. The foundation of rock and roll.' },
]

export default function TheoryPage() {
  const [tab, setTab] = useState('circle')
  const [selectedNote, setSelectedNote] = useState(null)

  const circlePositions = [
    { note: 'C', major: 'C', minor: 'Am', x: 150, y: 10 },
    { note: 'G', major: 'G', minor: 'Em', x: 225, y: 30 },
    { note: 'D', major: 'D', minor: 'Bm', x: 265, y: 100 },
    { note: 'A', major: 'A', minor: 'F#m', x: 265, y: 180 },
    { note: 'E', major: 'E', minor: 'C#m', x: 225, y: 250 },
    { note: 'B', major: 'B', minor: 'G#m', x: 150, y: 275 },
    { note: 'F#/Gb', major: 'F#', minor: 'Ebm', x: 75, y: 250 },
    { note: 'Db', major: 'Db', minor: 'Bbm', x: 30, y: 180 },
    { note: 'Ab', major: 'Ab', minor: 'Fm', x: 30, y: 100 },
    { note: 'Eb', major: 'Eb', minor: 'Cm', x: 75, y: 30 },
    { note: 'Bb', major: 'Bb', minor: 'Gm', x: 120, y: 15 },
    { note: 'F', major: 'F', minor: 'Dm', x: 35, y: 140 },
  ]

  return (
    <div className="min-h-screen bg-guitar-hero">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-2 text-center">📖 Music Theory</h1>
        <p className="text-gray-400 text-center mb-8">Understand the language of music</p>

        {/* Tabs */}
        <div className="flex gap-1 bg-black/30 p-1 rounded-xl mb-8 flex-wrap">
          {['circle', 'scales', 'chords', 'progressions'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium capitalize transition-all ${
                tab === t ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {t === 'circle' ? '⭕ Circle of 5ths' : t === 'scales' ? '🎵 Scales' : t === 'chords' ? '🎸 Chords' : '🔄 Progressions'}
            </button>
          ))}
        </div>

        {/* Circle of Fifths */}
        {tab === 'circle' && (
          <div className="bg-card rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4 text-center">Circle of Fifths</h2>
            <p className="text-gray-400 text-sm text-center mb-6">Keys that sound good together are adjacent on the circle</p>
            
            <div className="flex justify-center mb-6">
              <svg width="300" height="300" viewBox="0 0 300 300">
                {/* Outer circle */}
                <circle cx="150" cy="150" r="130" fill="rgba(249,115,22,0.05)" stroke="rgba(249,115,22,0.2)" strokeWidth="1" />
                <circle cx="150" cy="150" r="85" fill="rgba(124,58,237,0.05)" stroke="rgba(124,58,237,0.2)" strokeWidth="1" />
                <circle cx="150" cy="150" r="50" fill="rgba(59,130,246,0.05)" stroke="rgba(59,130,246,0.2)" strokeWidth="1" />

                {/* 12 positions */}
                {Array.from({ length: 12 }, (_, i) => {
                  const angle = (i * 30 - 90) * Math.PI / 180
                  const outerR = 112
                  const innerR = 68
                  const notes = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F']
                  const minors = ['Am', 'Em', 'Bm', 'F#m', 'C#m', 'G#m', 'Ebm', 'Bbm', 'Fm', 'Cm', 'Gm', 'Dm']
                  const ox = 150 + outerR * Math.cos(angle)
                  const oy = 150 + outerR * Math.sin(angle)
                  const ix = 150 + innerR * Math.cos(angle)
                  const iy = 150 + innerR * Math.sin(angle)
                  const isSelected = selectedNote === notes[i]
                  return (
                    <g key={i} onClick={() => setSelectedNote(isSelected ? null : notes[i])} style={{ cursor: 'pointer' }}>
                      <circle cx={ox} cy={oy} r="18" fill={isSelected ? 'rgba(249,115,22,0.4)' : 'rgba(249,115,22,0.1)'} stroke={isSelected ? '#f97316' : 'rgba(249,115,22,0.3)'} strokeWidth="1.5" />
                      <text x={ox} y={oy} textAnchor="middle" dominantBaseline="central" fill={isSelected ? '#f97316' : '#e2e8f0'} fontSize="10" fontWeight="bold">{notes[i]}</text>
                      <circle cx={ix} cy={iy} r="14" fill="rgba(124,58,237,0.1)" stroke="rgba(124,58,237,0.3)" strokeWidth="1" />
                      <text x={ix} y={iy} textAnchor="middle" dominantBaseline="central" fill="#a78bfa" fontSize="8">{minors[i]}</text>
                    </g>
                  )
                })}
                <text x="150" y="148" textAnchor="middle" dominantBaseline="central" fill="#60a5fa" fontSize="9">maj</text>
                <text x="150" y="158" textAnchor="middle" dominantBaseline="central" fill="#a78bfa" fontSize="9">min</text>
              </svg>
            </div>

            {selectedNote && (
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 text-center">
                <p className="text-orange-400 font-bold text-lg">{selectedNote} Major</p>
                <p className="text-gray-400 text-sm mt-1">Adjacent keys: {
                  ['C','G','D','A','E','B','F#','Db','Ab','Eb','Bb','F'].map((n, i, arr) => {
                    const idx = arr.indexOf(selectedNote)
                    return idx >= 0 && (i === (idx + 1) % 12 || i === (idx + 11) % 12) ? n : null
                  }).filter(Boolean).join(' & ')
                }</p>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-6">
              <div className="bg-orange-500/10 rounded-lg p-3 text-center">
                <div className="text-orange-400 font-bold text-sm">Outer Ring</div>
                <div className="text-gray-400 text-xs">Major keys</div>
              </div>
              <div className="bg-purple-500/10 rounded-lg p-3 text-center">
                <div className="text-purple-400 font-bold text-sm">Inner Ring</div>
                <div className="text-gray-400 text-xs">Relative minors</div>
              </div>
              <div className="bg-blue-500/10 rounded-lg p-3 text-center">
                <div className="text-blue-400 font-bold text-sm">Center</div>
                <div className="text-gray-400 text-xs">maj / min labels</div>
              </div>
            </div>
          </div>
        )}

        {/* Scales */}
        {tab === 'scales' && (
          <div className="space-y-4">
            {Object.entries(SCALES).map(([name, data]) => (
              <div key={name} className="bg-card rounded-xl p-5">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-white">{name}</h3>
                  <span className="text-xs text-orange-400 bg-orange-500/10 px-2 py-1 rounded-full">{data.description}</span>
                </div>
                <div className="bg-black/30 rounded-lg px-4 py-2 font-mono text-green-300 text-sm mb-2">
                  {data.example}
                </div>
                <div className="flex gap-1 mt-2">
                  {data.intervals.map((interval, i) => (
                    <div key={i} className="flex items-center">
                      <div className="w-8 h-8 rounded bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-xs text-orange-400 font-bold">
                        {['W','W','H','W','W','W','H'][i] || interval}
                      </div>
                      {i < data.intervals.length - 1 && <div className="w-2 h-px bg-white/10" />}
                    </div>
                  ))}
                </div>
                <p className="text-gray-500 text-xs mt-2">W = Whole step (2 frets) • H = Half step (1 fret)</p>
              </div>
            ))}
          </div>
        )}

        {/* Chords */}
        {tab === 'chords' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(CHORDS).map(([name, data]) => (
              <div key={name} className="bg-card rounded-xl p-5">
                <h3 className="font-bold text-white mb-1">{name}</h3>
                <div className="text-xs text-gray-400 mb-2">Formula: <span className="text-orange-400 font-mono">{data.formula}</span></div>
                <div className="text-xs text-gray-400 mb-2">Example: <span className="text-green-400 font-mono">{data.example}</span></div>
                <div className="text-xs italic text-gray-500">{data.sound}</div>
              </div>
            ))}
          </div>
        )}

        {/* Progressions */}
        {tab === 'progressions' && (
          <div className="space-y-4">
            {PROGRESSIONS.map((prog, i) => (
              <div key={i} className="bg-card rounded-xl p-5">
                <h3 className="font-bold text-white mb-1">{prog.name}</h3>
                <div className="flex gap-2 mb-3 flex-wrap">
                  <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded-full font-mono">{prog.chords}</span>
                  <span className="text-xs bg-green-500/10 text-green-400 px-2 py-1 rounded-full font-mono">{prog.example}</span>
                </div>
                <p className="text-gray-400 text-sm mb-2">{prog.description}</p>
                <p className="text-xs text-gray-500">Genres: {prog.genres}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
