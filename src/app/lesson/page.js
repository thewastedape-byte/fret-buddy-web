'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://fret-buddy-api.onrender.com'

export default function LessonPage() {
  const videoRef = useRef(null)
  const pipRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const autoCapureIntervalRef = useRef(null)
  const audioRef = useRef(null)

  // Refs to avoid stale closures in intervals
  const loadingRef = useRef(false)
  const cameraActiveRef = useRef(false)
  const speakingRef = useRef(false)

  const [cameraActive, setCameraActive] = useState(false)
  const [facingMode, setFacingMode] = useState('environment')
  const [recording, setRecording] = useState(false)
  const [lessonMode, setLessonMode] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'ai', text: '🎸 Hey! I\'m Buddy, your AI guitar teacher. Enable camera, then hit "Start Lesson Mode" — I\'ll watch your technique every 10 seconds. Or hold the mic button and ask me anything!' }
  ])
  const [loading, setLoading] = useState(false)
  const [currentTopic, setCurrentTopic] = useState('Getting Started')
  const [error, setError] = useState('')
  const [textInput, setTextInput] = useState('')
  const [guitarRecording, setGuitarRecording] = useState(false)
  const guitarRecorderRef = useRef(null)
  const guitarChunksRef = useRef([])

  const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('fretbuddy_token') : null

  // Android Chrome TTS cutoff fix — split into sentence chunks and queue
  const speakChunked = (text, onDone) => {
    if (!window.speechSynthesis) { onDone?.(); return }
    window.speechSynthesis.cancel()
    const clean = text
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/#{1,6}\s/g, '')
      .replace(/`(.+?)`/g, '$1')
      .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    // Split at sentence boundaries, max 180 chars per chunk
    const raw = clean.match(/[^.!?\n]+[.!?\n]*/g) || [clean]
    const chunks = []
    let cur = ''
    for (const s of raw) {
      if ((cur + s).length > 180) { if (cur) chunks.push(cur.trim()); cur = s }
      else cur += s
    }
    if (cur.trim()) chunks.push(cur.trim())
    const voices = window.speechSynthesis.getVoices()
    const voice = voices.find(v => v.name.includes('Google') && v.lang.startsWith('en'))
      || voices.find(v => v.lang.startsWith('en'))
    let i = 0
    const next = () => {
      if (i >= chunks.length) { onDone?.(); return }
      const u = new SpeechSynthesisUtterance(chunks[i++])
      u.rate = 0.92; u.pitch = 1.0; u.volume = 1.0
      if (voice) u.voice = voice
      u.onend = next
      u.onerror = () => { onDone?.() }
      window.speechSynthesis.speak(u)
    }
    next()
  }

  // Keep loadingRef in sync with state
  const setLoadingSync = (val) => {
    loadingRef.current = val
    setLoading(val)
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facingMode } },
        audio: false
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      setCameraActive(true)
      cameraActiveRef.current = true
      setError('')
    } catch (err) {
      setError('Camera access denied — please allow camera permission.')
    }
  }

  const flipCamera = async () => {
    const newMode = facingMode === 'environment' ? 'user' : 'environment'
    setFacingMode(newMode)
    if (!cameraActiveRef.current) return
    try {
      // Stop ALL tracks from the stored stream ref
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
        streamRef.current = null
      }
      // Null out both video elements
      if (videoRef.current) videoRef.current.srcObject = null
      if (pipRef.current) pipRef.current.srcObject = null
      // Brief pause so Android releases the camera hardware
      await new Promise(r => setTimeout(r, 300))
      // Start new stream with flipped camera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: newMode } },
        audio: false
      })
      streamRef.current = stream
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play() }
      if (pipRef.current) { pipRef.current.srcObject = stream; pipRef.current.play().catch(() => {}) }
    } catch (err) {
      setError(`Flip failed: ${err.message}`)
    }
  }

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop())
      videoRef.current.srcObject = null
    }
    setCameraActive(false)
    cameraActiveRef.current = false
    stopLessonMode()
  }

  const captureFrame = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return null
    // Use actual dimensions or fallback — don't block on videoWidth=0 (Android bug)
    canvas.width = video.videoWidth || video.clientWidth || 640
    canvas.height = video.videoHeight || video.clientHeight || 480
    try {
      const ctx = canvas.getContext('2d')
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.6)
      // Verify it's not a blank frame (blank = very short data URL)
      if (dataUrl.length < 1000) return null
      return dataUrl
    } catch {
      return null
    }
  }

  const sendToAI = async (text, imageData) => {
    if (loadingRef.current) return // prevent overlapping calls
    setLoadingSync(true)
    try {
      const token = getToken()
      const body = { message: text || 'Analyze my guitar technique' }
      if (imageData) body.image_base64 = imageData

      const res = await fetch(`${API_BASE}/api/teach`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)

      const aiText = data.response_text || data.response || data.message || '(no response from teacher)'
      setMessages(prev => [...prev, { role: 'ai', text: aiText }])
      if (data.topic) setCurrentTopic(data.topic)

      // TTS — chunk into sentences to fix Android Chrome cutoff bug
      try {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
          speakingRef.current = true
          speakChunked(aiText, () => { speakingRef.current = false })
        }
      } catch {
        speakingRef.current = false
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', text: `⚠️ Error: ${err.message}` }])
    } finally {
      setLoadingSync(false)
    }
  }

  const startLessonMode = () => {
    if (!cameraActiveRef.current) {
      setError('Enable camera first, then start Lesson Mode.')
      return
    }
    setLessonMode(true)
    setError('')
    setMessages(prev => [...prev, { role: 'system', text: '📸 Lesson Mode ON — analyzing every 10 seconds' }])
    autoCapureIntervalRef.current = setInterval(() => {
      if (loadingRef.current) return
      if (speakingRef.current) return // wait for Buddy to finish speaking
      if (!cameraActiveRef.current) return
      const frame = captureFrame()
      if (frame) sendToAI('Look closely at my fretting hand finger placement, thumb position, wrist angle, and which chord or notes I am forming. Be specific about what you see and give me one concrete correction or tip.', frame)
    }, 25000)
  }

  const stopLessonMode = () => {
    setLessonMode(false)
    if (autoCapureIntervalRef.current) {
      clearInterval(autoCapureIntervalRef.current)
      autoCapureIntervalRef.current = null
    }
  }

  // Guitar audio analysis — record playing and send to GPT-4o Audio
  const toggleGuitarRecord = async () => {
    if (guitarRecording) {
      if (guitarRecorderRef.current?.state === 'recording') {
        guitarRecorderRef.current.stop()
      }
      setGuitarRecording(false)
      return
    }
    if (loadingRef.current) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      guitarChunksRef.current = []
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      const mr = new MediaRecorder(stream, { mimeType })
      mr.ondataavailable = e => { if (e.data?.size > 0) guitarChunksRef.current.push(e.data) }
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        if (guitarChunksRef.current.length === 0) { setError('No audio captured'); return }
        const blob = new Blob(guitarChunksRef.current, { type: mimeType })
        // Convert to base64 and send for guitar analysis
        const reader = new FileReader()
        reader.onloadend = async () => {
          const base64 = reader.result.split(',')[1]
          const format = mimeType.includes('mp4') ? 'mp4' : 'webm'
          setMessages(prev => [...prev, { role: 'user', text: '🎸 [played guitar — analyzing...]' }])
          await sendGuitarAudio(base64, format)
        }
        reader.readAsDataURL(blob)
      }
      mr.start(250)
      guitarRecorderRef.current = mr
      setGuitarRecording(true)
      setError('')
    } catch (err) {
      setError(`Mic error: ${err.message}`)
    }
  }

  const sendGuitarAudio = async (base64, format) => {
    if (loadingRef.current) return
    setLoadingSync(true)
    try {
      const token = getToken()
      const body = {
        analyze_audio: true,
        audio_base64: base64,
        audio_format: format,
        message: 'Listen to my guitar playing and give me specific feedback. What notes or chords do you hear? Is my timing good? Any tuning issues?',
      }
      const res = await fetch(`${API_BASE}/api/teach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      const aiText = data.response_text || data.response || '(no response)'
      setMessages(prev => [
        ...prev.filter(m => m.text !== '🎸 [played guitar — analyzing...]'),
        { role: 'user', text: '🎸 [guitar audio]' },
        { role: 'ai', text: aiText },
      ])
      // Speak the response
      try {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
          speakingRef.current = true
          speakChunked(aiText, () => { speakingRef.current = false })
        }
      } catch { speakingRef.current = false }
    } catch (err) {
      setMessages(prev => [...prev.filter(m => m.text !== '🎸 [played guitar — analyzing...]'), { role: 'ai', text: `⚠️ ${err.message}` }])
    } finally {
      setLoadingSync(false)
    }
  }

  // Voice question recording — tap to start, tap again to stop & send
  const toggleRecording = async () => {
    if (recording) {
      // Stop recording
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop()
      }
      setRecording(false)
      return
    }

    if (loadingRef.current) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioChunksRef.current = []

      // Pick best supported MIME type
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4'

      const mr = new MediaRecorder(stream, { mimeType })
      mr.ondataavailable = e => {
        if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data)
      }
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        if (audioChunksRef.current.length === 0) {
          setError('No audio captured — speak then tap mic again to send')
          return
        }
        const blob = new Blob(audioChunksRef.current, { type: mimeType })
        await transcribeAndSend(blob, mimeType)
      }
      mr.start(250)
      mediaRecorderRef.current = mr
      setRecording(true)
      setError('')
    } catch (err) {
      setError(`Mic error: ${err.message} — try the text box instead`)
    }
  }

  const transcribeAndSend = async (audioBlob, mimeType) => {
    // Don't set loading here — sendToAI handles it
    try {
      const token = getToken()
      const fd = new FormData()
      fd.append('audio', audioBlob, mimeType.includes('mp4') ? 'recording.mp4' : 'recording.webm')
      const res = await fetch(`${API_BASE}/api/stt`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      })
      const data = await res.json()
      const text = data.transcript || data.text || ''
      if (text.trim()) {
        setMessages(prev => [...prev, { role: 'user', text }])
        const frame = cameraActiveRef.current ? captureFrame() : null
        await sendToAI(text, frame)
      } else {
        setError('Couldn\'t hear that — try speaking louder or use the text box')
      }
    } catch (err) {
      setError(`Transcription failed: ${err.message}`)
      // Fallback: send camera frame with default prompt
      const frame = cameraActiveRef.current ? captureFrame() : null
      if (frame) await sendToAI('Analyze my guitar technique', frame)
    }
  }

  // Text input send
  const sendText = async () => {
    const text = textInput.trim()
    if (!text || loadingRef.current) return
    setTextInput('')
    setMessages(prev => [...prev, { role: 'user', text }])
    const frame = cameraActiveRef.current ? captureFrame() : null
    await sendToAI(text, frame)
  }

  useEffect(() => {
    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(t => t.stop())
      }
      if (autoCapureIntervalRef.current) clearInterval(autoCapureIntervalRef.current)
    }
  }, [])

  // Wire PiP after cameraActive renders the pip video element into DOM
  useEffect(() => {
    if (cameraActive && pipRef.current && streamRef.current) {
      pipRef.current.srcObject = streamRef.current
      pipRef.current.play().catch(() => {})
    }
  }, [cameraActive])

  const messagesEndRef = useRef(null)
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="min-h-screen bg-[#080812] flex flex-col md:flex-row">
      {/* Camera Panel */}
      <div className="md:w-1/2 lg:w-3/5 flex flex-col">
        <div className="relative bg-black flex-1 min-h-[300px] md:min-h-screen flex items-center justify-center">
          {cameraActive ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ maxHeight: 'calc(100vh - 56px)' }}
            />
          ) : (
            <div className="text-center p-12">
              <div className="text-8xl mb-4">📷</div>
              <p className="text-gray-400 mb-6 text-lg">Enable camera to show Buddy your technique</p>
              <button
                onClick={startCamera}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-4 rounded-xl text-lg transition-all"
              >
                Enable Camera
              </button>
            </div>
          )}
          <canvas ref={canvasRef} className="hidden" />

          {cameraActive && (
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3 px-4">
              <button
                onClick={stopCamera}
                className="bg-black/70 hover:bg-black text-white text-sm px-4 py-2 rounded-full border border-white/20 transition-all"
              >
                📷 Off
              </button>
              <button
                onClick={lessonMode ? stopLessonMode : startLessonMode}
                disabled={loading}
                className={`text-sm px-4 py-2 rounded-full font-medium transition-all ${
                  lessonMode
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-orange-500 hover:bg-orange-600 text-white'
                }`}
              >
                {lessonMode ? '⏹ Stop Lesson Mode' : '▶ Start Lesson Mode'}
              </button>
              {!lessonMode && (
                <button
                  onClick={() => {
                    const frame = captureFrame()
                    if (frame) sendToAI('Analyze my guitar technique in detail', frame)
                  }}
                  disabled={loading}
                  className="bg-white/20 hover:bg-white/30 text-white text-sm px-4 py-2 rounded-full transition-all"
                >
                  📸 Analyze Now
                </button>
              )}
            </div>
          )}

          {lessonMode && (
            <div className="absolute top-4 left-4 bg-orange-500/90 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-2">
              <span>●</span> LIVE: {currentTopic}
            </div>
          )}

          {error && (
            <div
              className="absolute top-4 left-4 right-4 bg-red-500/90 text-white text-sm px-4 py-2 rounded-lg cursor-pointer"
              onClick={() => setError('')}
            >
              ⚠️ {error} (tap to dismiss)
            </div>
          )}
        </div>
      </div>

      {/* Chat Panel */}
      <div className="md:w-1/2 lg:w-2/5 flex flex-col bg-[#0d0d1a] border-l border-white/10" style={{ maxHeight: 'calc(100vh - 56px)' }}>
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-white">🎸 Buddy — AI Guitar Teacher</h2>
            <p className="text-xs text-gray-400">Topic: {currentTopic}</p>
          </div>
          <div className="flex gap-2">
            <Link href="/tabs" className="text-xs text-gray-400 hover:text-orange-400 transition-colors">Tabs</Link>
            <Link href="/theory" className="text-xs text-gray-400 hover:text-orange-400 transition-colors">Theory</Link>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`${
                msg.role === 'user'
                  ? 'ml-8 bg-orange-500/20 border border-orange-500/30 text-orange-100'
                  : msg.role === 'system'
                  ? 'bg-white/5 border border-white/10 text-gray-400 text-xs text-center italic'
                  : 'mr-8 bg-white/10 border border-white/10 text-gray-200'
              } rounded-xl px-4 py-3 text-sm leading-relaxed`}
            >
              {msg.role === 'ai' && <span className="text-orange-400 font-medium">🎸 Buddy: </span>}
              {msg.role === 'user' && <span className="text-orange-300 font-medium">You: </span>}
              {msg.text}
            </div>
          ))}
          {loading && (
            <div className="mr-8 bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-400 animate-pulse">
              🎸 Buddy is thinking...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Live camera preview pip */}
        {cameraActive && (
          <div className="px-4 pt-3">
            <div className="relative rounded-xl overflow-hidden bg-black border border-white/10" style={{ aspectRatio: '16/9' }}>
              <video
                ref={pipRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
                {lessonMode ? '🔴 Live' : '📷 Preview'}
              </div>
              <button
                onClick={flipCamera}
                className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full"
              >
                🔄 {facingMode === 'environment' ? 'Selfie' : 'Back'}
              </button>
              {lessonMode && (
                <div className="absolute bottom-2 right-2 bg-orange-500/80 text-white text-xs px-2 py-0.5 rounded-full">
                  analyzing every 10s
                </div>
              )}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="p-4 border-t border-white/10 space-y-3">
          {/* Guitar audio analysis button */}
          <button
            onClick={toggleGuitarRecord}
            disabled={loading || recording}
            className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              guitarRecording
                ? 'bg-red-500 ring-4 ring-red-300 text-white'
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            } disabled:opacity-50`}
          >
            {guitarRecording ? '⏹ Tap to stop & analyze' : '🎸 Record my playing'}
          </button>

          {/* Mic + camera toggle row */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleRecording}
              disabled={loading}
              className={`flex-shrink-0 w-14 h-14 rounded-full font-bold text-2xl transition-all ${
                recording
                  ? 'bg-red-500 scale-110 ring-4 ring-red-300'
                  : 'bg-orange-500 hover:bg-orange-600 active:scale-95'
              } text-white disabled:opacity-50`}
              title={recording ? 'Tap to stop & send' : 'Tap to speak'}
            >
              {recording ? '⏹️' : '🎤'}
            </button>

            <div className="flex-1 text-center">
              <p className="text-xs text-gray-400">
                {recording ? '🔴 Recording… tap ⏹️ to send' : 'Tap 🎤 to speak'}
              </p>
            </div>

            <button
              onClick={() => cameraActive ? stopCamera() : startCamera()}
              className={`flex-shrink-0 w-12 h-12 rounded-full text-xl transition-all border ${
                cameraActive
                  ? 'bg-green-500/20 border-green-500/40 text-green-400'
                  : 'bg-white/10 border-white/20 text-gray-400 hover:text-white'
              }`}
            >
              📷
            </button>
          </div>

          {/* Text input fallback */}
          <div className="flex gap-2">
            <input
              type="text"
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendText()}
              placeholder="Type a question to Buddy..."
              disabled={loading}
              className="flex-1 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 disabled:opacity-50"
            />
            <button
              onClick={sendText}
              disabled={loading || !textInput.trim()}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50 transition-all"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
