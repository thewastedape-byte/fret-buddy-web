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

  const [cameraActive, setCameraActive] = useState(false)
  const [recording, setRecording] = useState(false)
  const [lessonMode, setLessonMode] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'ai', text: '🎸 Hey! I\'m your AI guitar teacher. Point your camera at your guitar and hands, then hold the mic button to ask me anything — or just hit "Start Lesson Mode" and I\'ll watch your technique!' }
  ])
  const [loading, setLoading] = useState(false)
  const [currentTopic, setCurrentTopic] = useState('Getting Started')
  const [error, setError] = useState('')

  const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('fretbuddy_token') : null

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      setCameraActive(true)
      setError('')
    } catch (err) {
      setError('Camera access denied. Please allow camera permission to use AI lessons.')
    }
  }

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop())
      videoRef.current.srcObject = null
    }
    setCameraActive(false)
    if (lessonMode) stopLessonMode()
  }

  const captureFrame = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return null
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0)
    return canvas.toDataURL('image/jpeg', 0.7)
  }

  const sendToAI = useCallback(async (text, imageData) => {
    setLoading(true)
    try {
      const token = getToken()
      const body = { message: text || 'Analyze my guitar technique from the image' }
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
      if (!res.ok) throw new Error(data.error || 'AI error')

      const aiText = data.response || data.message || 'Great work! Keep it up.'
      setMessages(prev => [...prev, { role: 'ai', text: aiText }])
      setCurrentTopic(data.topic || currentTopic)

      // TTS
      if (data.audio_url) {
        if (audioRef.current) audioRef.current.pause()
        audioRef.current = new Audio(data.audio_url)
        audioRef.current.play().catch(() => {})
      } else {
        // Speak via TTS endpoint
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
            if (audioRef.current) audioRef.current.pause()
            audioRef.current = new Audio(url)
            audioRef.current.play().catch(() => {})
          }
        } catch {}
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', text: `⚠️ ${err.message}` }])
    } finally {
      setLoading(false)
    }
  }, [currentTopic])

  const startLessonMode = () => {
    setLessonMode(true)
    setMessages(prev => [...prev, { role: 'system', text: '📸 Lesson Mode ON — capturing your technique every 5 seconds' }])
    autoCapureIntervalRef.current = setInterval(() => {
      const frame = captureFrame()
      if (frame) sendToAI('Analyze my guitar technique', frame)
    }, 5000)
  }

  const stopLessonMode = () => {
    setLessonMode(false)
    if (autoCapureIntervalRef.current) {
      clearInterval(autoCapureIntervalRef.current)
      autoCapureIntervalRef.current = null
    }
    setMessages(prev => [...prev, { role: 'system', text: '⏹ Lesson Mode OFF' }])
  }

  // Voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioChunksRef.current = []
      const mr = new MediaRecorder(stream)
      mr.ondataavailable = e => audioChunksRef.current.push(e.data)
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        await transcribeAndSend(blob)
      }
      mr.start()
      mediaRecorderRef.current = mr
      setRecording(true)
    } catch (err) {
      setError('Mic access denied')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    setRecording(false)
  }

  const transcribeAndSend = async (audioBlob) => {
    setLoading(true)
    try {
      const token = getToken()
      const fd = new FormData()
      fd.append('audio', audioBlob, 'recording.webm')
      const res = await fetch(`${API_BASE}/api/stt`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      })
      const data = await res.json()
      const text = data.text || data.transcript || ''
      if (text.trim()) {
        setMessages(prev => [...prev, { role: 'user', text }])
        const frame = cameraActive ? captureFrame() : null
        await sendToAI(text, frame)
      }
    } catch (err) {
      // If STT fails, send frame with default prompt
      const frame = cameraActive ? captureFrame() : null
      await sendToAI('Look at my technique and give feedback', frame)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    return () => {
      stopCamera()
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
              <p className="text-gray-400 mb-6 text-lg">Enable camera to show your AI teacher your technique</p>
              <button
                onClick={startCamera}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-4 rounded-xl text-lg transition-all"
              >
                Enable Camera
              </button>
            </div>
          )}
          <canvas ref={canvasRef} className="hidden" />

          {/* Camera overlay controls */}
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
                    ? 'bg-red-500 hover:bg-red-600 text-white pulse-rec'
                    : 'bg-orange-500 hover:bg-orange-600 text-white'
                }`}
              >
                {lessonMode ? '⏹ Stop Auto-Capture' : '▶ Start Lesson Mode'}
              </button>
            </div>
          )}

          {/* Topic badge */}
          {lessonMode && (
            <div className="absolute top-4 left-4 bg-orange-500/90 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-2">
              <span className="pulse-rec">●</span> LIVE: {currentTopic}
            </div>
          )}

          {error && (
            <div className="absolute top-4 left-4 right-4 bg-red-500/90 text-white text-sm px-4 py-2 rounded-lg">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Chat Panel */}
      <div className="md:w-1/2 lg:w-2/5 flex flex-col bg-[#0d0d1a] border-l border-white/10" style={{ maxHeight: 'calc(100vh - 56px)' }}>
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-white">🎸 AI Guitar Teacher</h2>
            <p className="text-xs text-gray-400">Topic: {currentTopic}</p>
          </div>
          <div className="flex gap-2">
            <Link href="/tabs" className="text-xs text-gray-400 hover:text-orange-400 transition-colors">Tabs</Link>
            <Link href="/theory" className="text-xs text-gray-400 hover:text-orange-400 transition-colors">Theory</Link>
          </div>
        </div>

        {/* Messages */}
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
              {msg.role === 'ai' && <span className="text-orange-400 font-medium">🎸 Teacher: </span>}
              {msg.role === 'user' && <span className="text-orange-300 font-medium">You: </span>}
              {msg.text}
            </div>
          ))}
          {loading && (
            <div className="mr-8 bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-400">
              🎸 Teacher is thinking...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Controls */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            {/* Mic button */}
            <button
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onTouchStart={(e) => { e.preventDefault(); startRecording() }}
              onTouchEnd={(e) => { e.preventDefault(); stopRecording() }}
              disabled={loading}
              className={`flex-shrink-0 w-14 h-14 rounded-full font-bold text-2xl transition-all ${
                recording
                  ? 'bg-red-500 scale-110 glow-orange pulse-rec'
                  : 'bg-orange-500 hover:bg-orange-600 hover:scale-105'
              } text-white disabled:opacity-50`}
              title="Hold to speak"
            >
              🎤
            </button>

            <div className="flex-1 text-center">
              <p className="text-xs text-gray-400">
                {recording ? '🔴 Recording... release to send' : 'Hold mic to speak to your teacher'}
              </p>
              {cameraActive && !lessonMode && (
                <button
                  onClick={() => {
                    const frame = captureFrame()
                    sendToAI('What do you see? Give me guitar technique feedback.', frame)
                  }}
                  disabled={loading}
                  className="text-xs text-orange-400 hover:text-orange-300 mt-1 underline"
                >
                  📸 Analyze my technique now
                </button>
              )}
            </div>

            <button
              onClick={() => {
                if (!cameraActive) startCamera()
                else stopCamera()
              }}
              className={`flex-shrink-0 w-12 h-12 rounded-full text-xl transition-all border ${
                cameraActive
                  ? 'bg-green-500/20 border-green-500/40 text-green-400'
                  : 'bg-white/10 border-white/20 text-gray-400 hover:text-white'
              }`}
            >
              📷
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
