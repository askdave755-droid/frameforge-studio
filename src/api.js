const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

export const hasRenderApi = Boolean(API_URL)

async function request(path, options = {}) {
  if (!API_URL) throw new Error('VITE_API_URL is not configured')
  const response = await fetch(`${API_URL}${path}`, options)
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.error || `Render API returned ${response.status}`)
  return payload
}

export function createRender({ image, prompt, narration, duration, aspect, style, intensity, voiceId }) {
  const body = new FormData()
  body.append('image', image, image.name || 'source-image.jpg')
  body.append('prompt', prompt)
  body.append('narration', narration)
  body.append('duration', duration)
  body.append('aspect', aspect)
  body.append('style', style)
  body.append('intensity', String(intensity))
  body.append('voiceId', voiceId || '')
  return request('/api/render', { method: 'POST', body })
}

export function getRender(jobId) {
  return request(`/api/render/${jobId}`)
}
