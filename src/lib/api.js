const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://fret-buddy-api.onrender.com'

function getToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('fretbuddy_token')
}

async function request(path, options = {}) {
  const token = getToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  }
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
  return data
}

// Auth
export const api = {
  auth: {
    register: (body) => request('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),
    login: (body) => request('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  },
  user: {
    me: () => request('/api/user/me'),
    update: (body) => request('/api/user/me', { method: 'PATCH', body: JSON.stringify(body) }),
  },
  teach: {
    sendFrame: (body) => request('/api/teach', { method: 'POST', body: JSON.stringify(body) }),
  },
  tts: {
    speak: (body) => fetch(`${API_BASE}/api/tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      },
      body: JSON.stringify(body),
    }),
  },
  stt: {
    transcribe: (formData) => fetch(`${API_BASE}/api/stt`, {
      method: 'POST',
      headers: getToken() ? { Authorization: `Bearer ${getToken()}` } : {},
      body: formData,
    }).then(r => r.json()),
  },
  tabs: {
    list: () => request('/api/tabs'),
    search: (q) => request(`/api/tabs/search?q=${encodeURIComponent(q)}`),
    get: (id) => request(`/api/tabs/${id}`),
  },
  theory: {
    get: () => request('/api/theory'),
  },
  youtube: {
    search: (q) => request(`/api/youtube/search?q=${encodeURIComponent(q)}`),
  },
  stripe: {
    checkout: (body) => request('/api/stripe/checkout', { method: 'POST', body: JSON.stringify(body) }),
  },
}

export default api
