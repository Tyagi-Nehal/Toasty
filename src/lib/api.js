// Thin fetch wrapper for the local backend (server/index.js, port 4000).
// Local dev only — no deployment/env-based URL switching yet.
const BASE_URL = 'http://localhost:4000/api'

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const body = res.status === 204 ? null : await res.json()
  return { ok: res.ok, status: res.status, body }
}

export function get(path) {
  return request(path)
}

export function post(path, data) {
  return request(path, { method: 'POST', body: JSON.stringify(data) })
}

export function patch(path) {
  return request(path, { method: 'PATCH' })
}
