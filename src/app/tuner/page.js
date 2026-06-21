'use client'
import { useState, useRef, useEffect } from 'react'

const STANDARD_TUNING = [
  { string: 'E6', freq: 82.41, note: 'E', octave: 2 },
  { string: 'A5', freq: 110.00, note: 'A', octave: 2 },
  { string: 'D4', freq: 146.83, note: 'D', octave: 3 },
  { string: 'G3', freq: 196.00, note: 'G', octave: 3 },
  { string: 'B2', freq: 246.94, note: 'B', octave: 3 },
  { string: 'E1', freq: 329.63, note: 'E', octave: 4 },
]

const TUNINGS = {
  'Standard (EADGBe)': STANDARD_TUNING,
  'Drop D (DADGBe)': [
    { string: 'D6', freq: 73.42, note: 'D', octave: 2 },
    ...STANDARD_TUNING.slice(1),
  ],
  'Open G (DGDGBd)': [
    { string: 'D6', freq: 73.42, note: 'D', octave: 2 },
    { string: 'G5', freq: 98.00, note: 'G', octave: 2 },
    { string: 'D4', freq: 146.83, note: 'D', octave: 3 },
    { string: 'G3', freq: 196.00, note: 'G', octave: 3 },
    { string: 'B2', freq: 246.94, note: 'B', octave: 3 },
    { string: 'd1', freq: 293.66, note: 'D', octave: 4 },
  ],
  'DADGAD': [
    { string: 'D6', freq: 73.42, note: 'D', octave: 2 },
    { string: 'A5', freq: 110.00, note: 'A', octave: 2 },
    { string: 'D4', freq: 146.83, note: 'D', octave: 3 },
    { string: 'G3', freq: 196.00, note: 'G', octave: 3 },
    { string: 'A2', freq: 220.00, note: 'A', octave: 3 },
    { string: 'd1', freq: 293.66, note: 'D', octave: 4 },
  ],
}

const ALL_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

function freqToNote(freq) {
  if (!freq || freq < 20) return null
  const semitones = 12 * Math.log2(freq / 440)
  const noteIndex = Math.round(semitones) + 9 + 12 * 4
  const note = ALL_NOTES[((noteIndex % 12) + 12) % 12]
  const targetFreq = 440 * Math.pow(2, (Math.round(semitones)) / 12)
  const cents = 1200 * Math.log2(freq / targetFreq)
  return { note, cents, targetFreq }
}

function autocorrelate(buffer, sampleRate) {
  let SIZE = buffer.length
  let rms = 0
  for (let i = 0; i < SIZE; i++) rms += buffer[i] * buffer[i]
  rms = Math.sqrt(rms / SIZE)
  if (rms < 0.01) return -1

  let r1 = 0, r2 = SIZE - 1
  for (let i = 0; i < SIZE / 2; i++) if (Math.abs(buffer[i]) < 0.2) { r1 = i; break }
  for (let i = 1; i < SIZE / 2; i++) if (Math.abs(buffer[SIZE - i]) < 0.2) { r2 = SIZE - i; break }
  buffer = buffer.slice(r1, r2)
  SIZE = buffer.length

  const c = new Float32Array(SIZE).fill(0)
  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE - i; j++) c[i] = c[i] + buffer[j] * buffer[j + i]
  }

  let d = 0
  while (c[d] > c[d + 1]) d++
  let maxval = -1, maxpos = -1
  for (let i = d; i < SIZE; i++) if (c[i] > maxval) { maxval = c[i]; maxpos = i }

  let T0 = maxpos
  const x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1]
  const a = (x1 + x3 - 2 * x2) / 2
  const b = (x3 - x1) / 2
  if (a) T0 = T0 - b / (2 * a)
  return sampleRate / T0
}

export default function TunerPage() {
  const [active, setActive] = useState(false)
  const [detectedNote, setDetectedNote] = useState(null)
  const [cents, setCents] = useState(0)
  const [detectedFreq, setDetectedFreq] = useState(null)
  const [selectedTuning, setSelectedTuning] = useState('Standard (EADGBe)')
  const [selectedString, setSelectedString] = useState(null)

  const audioCtxRef = useRef(null)
  const analyserRef = useRef(null)
  const sourceRef = useRef(null)
  const rafRef = useRef(null)
  const streamRef = useRef(null)

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      audioCtxRef.current = ctx
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 2048
      analyserRef.current = analyser
      const source = ctx.createMediaStreamSource(stream)
      source.connect(analyser)
      sourceRef.current = source
      setActive(true)
      detect()
    } catch (err) {
      alert('Mic access required for tuner')
    }
  }

  const stop = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
    if (audioCtxRef.current) audioCtxRef.current.close()
    setActive(false)
    setDetectedNote(null)
    setDetectedFreq(null)
    setCents(0)
  }

  const detect = () => {
    const analyser = analyserRef.current
    if (!analyser) return
    const buf = new Float32Array(analyser.fftSize)
    analyser.getFloatTimeDomainData(buf)
    const freq = autocorrelate(buf, analyserRef.current.context.sampleRate)
    if (freq > 20 && freq < 1000) {
      const result = freqToNote(freq)
      if (result) {
        setDetectedNote(result.note)
        setCents(Math.round(result.cents))
        setDetectedFreq(Math.round(freq * 10) / 10)
      }
    }
    rafRef.current = requestAnimationFrame(detect)
  }

  useEffect(() => () => { if (active) stop() }, [])

  const inTune = detectedNote && Math.abs(cents) < 5
  const needleX = 50 + (cents / 50) * 40
  const tuning = TUNINGS[selectedTuning]

  return (
    <div className="min-h-screen bg-guitar-hero flex flex-col items-center justify-center px-4 py-12">
      <h1 className="text-3xl font-bold text-white mb-2 text-center">🎼 Chromatic Tuner</h1>
      <p className="text-gray-400 mb-8 text-center">Tune your guitar using your microphone</p>

      <div className="bg-card rounded-2xl p-8 w-full max-w-md">
        {/* Note display */}
        <div className="text-center mb-8">
          <div
            className={`text-8xl font-extrabold tabular-nums transition-colors ${
              inTune ? 'text-green-400' : detectedNote ? 'text-orange-400' : 'text-gray-600'
            }`}
          >
            {detectedNote || '–'}
          </div>
          {detectedFreq && (
            <div className="text-gray-400 text-sm mt-1">{detectedFreq} Hz</div>
          )}
        </div>

        {/* Needle gauge */}
        <div className="mb-8">
          <div className="relative h-20 bg-black/40 rounded-xl overflow-hidden border border-white/10">
            {/* Tick marks */}
            {[-40, -30, -20, -10, 0, 10, 20, 30, 40].map(t => (
              <div
                key={t}
                className={`absolute top-0 bottom-0 w-px ${t === 0 ? 'bg-orange-400 w-0.5' : 'bg-white/20'}`}
                style={{ left: `${50 + (t / 50) * 40}%` }}
              />
            ))}

            {/* Zone indicators */}
            <div className="absolute top-0 left-[42%] right-[42%] h-full bg-green-500/10 rounded" />

            {/* Needle */}
            {detectedNote && (
              <div
                className={`absolute top-2 bottom-2 w-1 rounded-full transition-all ${
                  inTune ? 'bg-green-400' : 'bg-orange-400'
                }`}
                style={{ left: `${needleX}%`, transform: 'translateX(-50%)' }}
              />
            )}

            {/* Labels */}
            <div className="absolute bottom-1 left-2 text-xs text-red-400">♭ Flat</div>
            <div className="absolute bottom-1 right-2 text-xs text-red-400">Sharp ♯</div>
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-xs text-green-400">✓ In Tune</div>
          </div>

          <div className="text-center mt-2">
            {inTune ? (
              <span className="text-green-400 font-bold">✓ In Tune!</span>
            ) : detectedNote ? (
              <span className="text-orange-400">
                {cents > 0 ? `+${cents}¢ — tune down` : `${cents}¢ — tune up`}
              </span>
            ) : (
              <span className="text-gray-500">Play a string...</span>
            )}
          </div>
        </div>

        {/* Start/Stop */}
        <button
          onClick={active ? stop : start}
          className={`w-full py-4 rounded-xl font-bold text-lg transition-all mb-6 ${
            active
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-orange-500 hover:bg-orange-600 text-white glow-orange'
          }`}
        >
          {active ? '⏹ Stop Tuning' : '🎤 Start Tuning'}
        </button>

        {/* Tuning selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">Tuning</label>
          <select
            value={selectedTuning}
            onChange={e => setSelectedTuning(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-400"
          >
            {Object.keys(TUNINGS).map(t => (
              <option key={t} value={t} className="bg-gray-900">{t}</option>
            ))}
          </select>
        </div>

        {/* String reference */}
        <div>
          <p className="text-sm text-gray-400 mb-2">String reference:</p>
          <div className="flex gap-2">
            {tuning.map((s, i) => (
              <button
                key={i}
                onClick={() => setSelectedString(selectedString === i ? null : i)}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                  selectedString === i
                    ? 'bg-orange-500 text-white'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                <div className="text-xs">{s.string[1]}</div>
                <div>{s.note}</div>
              </button>
            ))}
          </div>
          {selectedString !== null && (
            <p className="text-center text-sm text-orange-400 mt-2">
              String {selectedString + 1}: {tuning[selectedString].note} — {tuning[selectedString].freq.toFixed(2)} Hz
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
