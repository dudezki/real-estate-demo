export interface TokenResponse {
  token: string
  url: string
  room: string
  identity: string
  expires_in: number
}

export class ApiError extends Error {
  status: number
  retryAfter?: number
  constructor(message: string, status: number, retryAfter?: number) {
    super(message)
    this.status = status
    this.retryAfter = retryAfter
  }
}

const BASE = import.meta.env.VITE_API_BASE ?? ''

/** Ask the backend for a short-lived, single-session LiveKit token. No secrets reach the browser. */
export async function requestToken(signal?: AbortSignal): Promise<TokenResponse> {
  let res: Response
  try {
    res = await fetch(`${BASE}/api/token`, { method: 'POST', signal, headers: { 'Content-Type': 'application/json' }, body: '{}' })
  } catch {
    throw new ApiError('Cannot reach the voice service. Is the backend running?', 0)
  }
  if (!res.ok) {
    const detail = await res.json().then((j) => j.detail as string).catch(() => '')
    const retry = Number(res.headers.get('Retry-After')) || undefined
    throw new ApiError(detail || `Voice service error (${res.status})`, res.status, retry)
  }
  return res.json()
}
