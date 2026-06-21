'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://fret-buddy-api.onrender.com'

export default function LessonPage() {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const autoCapureIntervalRef = useRef(null)
  const audioRef = useRef(null)

  // Refs to avoid stale closures in intervals
  const loadingRef = useRef(false)
  const cameraActiveRef = useRef(false)

  const [cameraActive, setCameraActive] = useState(false)
  const [recording, setRecording] = useState(false)
  const [lessonMode, setLessonMode] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'ai', text: '🎸 Hey! I\'m Buddy, your AI guitar teacher. Enable camera, then hit "Start Lesson Mode" — I\'ll watch your technique every 10 seconds. Or hold the mic button and ask me anything!' }
  ])
  const [loading, setLoading] = useState(false)
  const [currentTopic, setCurrentTopic] = useState('Getting Started')
  const [error, setError] = useState('')
  const [textInput, setTextInput] = useState('')

  const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('fretbuddy_token') : null

  // Keep loadingRef in sync with state
  const setLoadingSync = (val) => {
    loadingRef.current = val
    setLoading(val)
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false
      })
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
    if (!video || !canvas || !video.videoWidth) return null
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0)
    return canvas.toDataURL('image/jpeg', 0.6)
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

      // TTS — wrapped in try/catch, autoplay may be blocked on mobile
      try {
        const ttsRes = await fetch(`${API_BASE}/api/tts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ text: aiText.slice(0, 300) }),
        })
        if (ttsRes.ok) {
          const blob = await ttsRes.blob()
          const url = URL.createObjectURL(blob)
          if (audioRef.current) {
            audioRef.current.pause()
            URL.revokeObjectURL(audioRef.current.src)
          }
          audioRef.current = new Audio(url)
          await audioRef.current.play()
        }
      } catch {
        // TTS failure is non-fatal — text response still shown
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
      if (loadingRef.current) return // uses ref, not stale state
      if (!cameraActiveRef.current) return
      const frame = captureFrame()
      if (frame) sendToAI('Analyze my guitar technique in detail', frame)
    }, 10000)
  }

  const stopLessonMode = () => {
    setLessonMode(false)
    if (autoCapureIntervalRef.current) {
      clearInterval(autoCapureIntervalRef.current)
      autoCapureIntervalRef.current = null
    }
  }

  // Voice recording — uses timeslice for reliable Android capture
  const startRecording = async () => {
    if (loadingRef.current) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioChunksRef.current = []

      // Pick best supported format
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
          setError('No audio captured — try holding longer')
          return
        }
        const blob = new Blob(audioChunksRef.current, { type: mimeType })
        await transcribeAndSend(blob, mimeType)
      }
      mr.start(250) // timeslice: fire ondataavailable every 250ms for reliability
      mediaRecorderRef.current = mr
      setRecording(true)
      setError('')
    } catch (err) {
      setError(`Mic error: ${err.message}`)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    setRecording(false)
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

        {/* Controls */}
        <div className="p-4 border-t border-white/10 space-y-3">
          {/* Mic + camera toggle row */}
          <div className="flex items-center gap-3">
            <button
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onTouchStart={(e) => { e.preventDefault(); startRecording() }}
              onTouchEnd={(e) => { e.preventDefault(); stopRecording() }}
              disabled={loading}
              className={`flex-shrink-0 w-14 h-14 rounded-full font-bold text-2xl transition-all ${
                recording
                  ? 'bg-red-500 scale-110'
                  : 'bg-orange-500 hover:bg-orange-600 hover:scale-105'
              } text-white disabled:opacity-50`}
              title="Hold to speak"
            >
              🎤
            </button>

            <div className="flex-1 text-center">
              <p className="text-xs text-gray-400">
                {recording ? '🔴 Recording — release to send' : 'Hold mic to speak'}
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
