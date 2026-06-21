'use client'
import { useState, useRef, useEffect, useCallback } from 'react'

const TIME_SIGS = [
  { label: '4/4', beats: 4 },
  { label: '3/4', beats: 3 },
  { label: '6/8', beats: 6 },
]

export default function MetronomePage() {
  const [bpm, setBpm] = useState(120)
  const [playing, setPlaying] = useState(false)
  const [timeSig, setTimeSig] = useState(TIME_SIGS[0])
  const [currentBeat, setCurrentBeat] = useState(0)
  const [pendulumAngle, setPendulumAngle] = useState(0)
  const [tapTimes, setTapTimes] = useState([])

  const audioCtxRef = useRef(null)
  const schedulerRef = useRef(null)
  const nextNoteTimeRef = useRef(0)
  const beatRef = useRef(0)
  const pendulumRef = useRef(null)

  const getAudioCtx = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)()
    }
    return audioCtxRef.current
  }

  const scheduleNote = useCallback((time, isAccent) => {
    const ctx = getAudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = isAccent ? 1000 : 700
    gain.gain.setValueAtTime(isAccent ? 0.5 : 0.3, time)
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05)
    osc.start(time)
    osc.stop(time + 0.05)
  }, [])

  const scheduler = useCallback(() => {
    const ctx = getAudioCtx()
    const secondsPerBeat = 60.0 / bpm
    while (nextNoteTimeRef.current < ctx.currentTime + 0.1) {
      const isAccent = beatRef.current % timeSig.beats === 0
      scheduleNote(nextNoteTimeRef.current, isAccent)
      setCurrentBeat(beatRef.current % timeSig.beats)
      beatRef.current = (beatRef.current + 1) % timeSig.beats
      nextNoteTimeRef.current += secondsPerBeat
    }
  }, [bpm, timeSig, scheduleNote])

  useEffect(() => {
    if (playing) {
      const ctx = getAudioCtx()
      if (ctx.state === 'suspended') ctx.resume()
      nextNoteTimeRef.current = ctx.currentTime
      beatRef.current = 0
      schedulerRef.current = setInterval(scheduler, 25)
    } else {
      if (schedulerRef.current) clearInterval(schedulerRef.current)
      setCurrentBeat(0)
    }
    return () => { if (schedulerRef.current) clearInterval(schedulerRef.current) }
  }, [playing, scheduler])

  // Pendulum animation
  useEffect(() => {
    if (!playing) return
    const interval = setInterval(() => {
      setPendulumAngle(prev => prev > 0 ? -30 : 30)
    }, (60 / bpm) * 1000)
    return () => clearInterval(interval)
  }, [playing, bpm])

  const tapTempo = () => {
    const now = Date.now()
    setTapTimes(prev => {
      const times = [...prev, now].filter(t => now - t < 3000)
      if (times.length >= 2) {
        const intervals = []
        for (let i = 1; i < times.length; i++) {
          intervals.push(times[i] - times[i - 1])
        }
        const avg = intervals.reduce((a, b) => a + b) / intervals.length
        const newBpm = Math.round(60000 / avg)
        setBpm(Math.max(20, Math.min(300, newBpm)))
      }
      return times
    })
  }

  return (
    <div className="min-h-screen bg-guitar-hero flex flex-col items-center justify-center px-4 py-12">
      <h1 className="text-3xl font-bold text-white mb-2 text-center">⏱ Metronome</h1>
      <p className="text-gray-400 mb-10 text-center">Keep perfect time</p>

      <div className="bg-card rounded-2xl p-8 w-full max-w-md">
        {/* Pendulum Visual */}
        <div className="flex justify-center mb-8" style={{ height: 180 }}>
          <div className="relative flex flex-col items-center justify-start" style={{ width: 80, height: 180 }}>
            {/* Pivot */}
            <div className="w-4 h-4 rounded-full bg-orange-500 z-10" />
            {/* Rod */}
            <div
              style={{
                width: 4,
                height: 140,
                background: 'linear-gradient(to bottom, #f97316, #888)',
                transformOrigin: 'top center',
                transform: `rotate(${pendulumAngle}deg)`,
                transition: playing ? `transform ${(60 / bpm) * 0.9}s ease-in-out` : 'none',
                borderRadius: 2,
                marginTop: -8,
              }}
            >
              {/* Bob */}
              <div
                style={{
                  position: 'absolute',
                  bottom: -12,
                  left: -14,
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: playing ? '#f97316' : '#888',
                  boxShadow: playing ? '0 0 16px rgba(249,115,22,0.6)' : 'none',
                  transition: 'background 0.2s, box-shadow 0.2s',
                }}
              />
            </div>
          </div>
        </div>

        {/* Beat indicators */}
        <div className="flex justify-center gap-3 mb-8">
          {Array.from({ length: timeSig.beats }).map((_, i) => (
            <div
              key={i}
              className={`w-8 h-8 rounded-full border-2 transition-all ${
                playing && currentBeat === i
                  ? i === 0
                    ? 'bg-orange-500 border-orange-500 scale-125'
                    : 'bg-orange-400/60 border-orange-400'
                  : 'border-white/20'
              }`}
            />
          ))}
        </div>

        {/* BPM Display */}
        <div className="text-center mb-6">
          <div className="text-6xl font-extrabold text-white tabular-nums">{bpm}</div>
          <div className="text-gray-400 text-sm mt-1">BPM</div>
        </div>

        {/* BPM Slider */}
        <div className="mb-6">
          <input
            type="range"
            min={20}
            max={300}
            value={bpm}
            onChange={e => setBpm(Number(e.target.value))}
            className="w-full accent-orange-500"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>20</span>
            <span className="text-gray-400">{
              bpm < 60 ? 'Largo' :
              bpm < 76 ? 'Adagio' :
              bpm < 108 ? 'Andante' :
              bpm < 120 ? 'Moderato' :
              bpm < 156 ? 'Allegro' :
              bpm < 176 ? 'Vivace' : 'Presto'
            }</span>
            <span>300</span>
          </div>
        </div>

        {/* Time Signatures */}
        <div className="flex gap-2 mb-6 justify-center">
          {TIME_SIGS.map(ts => (
            <button
              key={ts.label}
              onClick={() => { setTimeSig(ts); setPlaying(false) }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                timeSig.label === ts.label
                  ? 'bg-orange-500 text-white'
                  : 'border border-white/20 text-gray-300 hover:border-orange-400 hover:text-orange-400'
              }`}
            >
              {ts.label}
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="flex gap-3">
          <button
            onClick={() => setPlaying(p => !p)}
            className={`flex-1 py-4 rounded-xl font-bold text-lg transition-all ${
              playing
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-orange-500 hover:bg-orange-600 text-white glow-orange'
            }`}
          >
            {playing ? '⏹ Stop' : '▶ Start'}
          </button>
          <button
            onClick={tapTempo}
            className="px-6 py-4 rounded-xl font-bold border border-white/20 text-white hover:border-orange-400 hover:text-orange-400 transition-all"
          >
            TAP
          </button>
        </div>

        {/* Common BPM presets */}
        <div className="mt-6 flex flex-wrap gap-2 justify-center">
          {[60, 80, 100, 120, 140, 160].map(b => (
            <button
              key={b}
              onClick={() => setBpm(b)}
              className={`px-3 py-1 rounded-full text-xs border transition-all ${
                bpm === b ? 'bg-orange-500/20 border-orange-500 text-orange-400' : 'border-white/20 text-gray-400 hover:text-white hover:border-white/40'
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
