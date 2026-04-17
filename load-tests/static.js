/**
 * Load test: HTTP GET against your SPA host (Vite preview, Vercel, etc.).
 *
 * Run:
 *   k6 run -e BASE_URL=http://localhost:4173 load-tests/static.js
 *   k6 run -e BASE_URL=https://your-app.vercel.app load-tests/static.js
 *
 * Prereq (local): keep preview running in another terminal while k6 runs:
 *   cd frontend && npm run build && npm run preview
 */
import http from 'k6/http'
import { check, sleep } from 'k6'

export function setup() {
  const base = __ENV.BASE_URL
  if (!base) {
    throw new Error('Set BASE_URL, e.g. -e BASE_URL=http://localhost:4173')
  }
  const root = base.replace(/\/$/, '')
  const res = http.get(`${root}/`)
  if (res.error) {
    throw new Error(
      `Cannot reach ${root} (${res.error}). For localhost: open another terminal and run: cd frontend && npm run build && npm run preview — then rerun k6.`
    )
  }
  return {}
}

export const options = {
  stages: [
    { duration: '20s', target: 5 },
    { duration: '40s', target: 20 },
    { duration: '20s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<2000'],
  },
}

export default function () {
  const base = __ENV.BASE_URL
  if (!base) {
    throw new Error('Set BASE_URL, e.g. -e BASE_URL=http://localhost:4173')
  }
  const root = base.replace(/\/$/, '')
  const res = http.get(`${root}/`)
  check(res, {
    'index status 200': (r) => r.status === 200,
    'index has html': (r) => r.body && r.body.includes('<html'),
  })
  sleep(0.3)
}
