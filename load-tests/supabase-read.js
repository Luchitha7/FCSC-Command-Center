/**
 * Load test: Supabase PostgREST reads similar to Events list + Event details.
 * Uses anon key (same as the browser). If RLS requires a logged-in user, pass
 * SUPABASE_JWT (Bearer) from a browser session or test user.
 *
 * Run (staging recommended):
 *   k6 run -e SUPABASE_URL=https://xxxx.supabase.co -e SUPABASE_ANON_KEY=eyJ... load-tests/supabase-read.js
 *
 * Optional:
 *   -e EVENT_ID=<uuid>  — include per-event reads (milestones, members, …)
 */
import http from 'k6/http'
import { check, sleep } from 'k6'

export const options = {
  stages: [
    { duration: '30s', target: 5 },
    { duration: '1m', target: 15 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.1'],
    http_req_duration: ['p(95)<3000'],
  },
}

function headers() {
  const url = __ENV.SUPABASE_URL
  const anon = __ENV.SUPABASE_ANON_KEY
  const jwt = __ENV.SUPABASE_JWT || anon
  if (!url || !anon) {
    throw new Error('Set SUPABASE_URL and SUPABASE_ANON_KEY')
  }
  return {
    apikey: anon,
    Authorization: `Bearer ${jwt}`,
    Accept: 'application/json',
  }
}

export default function () {
  const base = __ENV.SUPABASE_URL.replace(/\/$/, '')
  const h = headers()

  const listRes = http.get(`${base}/rest/v1/events?select=id,name,date&limit=30`, {
    headers: h,
    tags: { name: 'events_list' },
  })
  check(listRes, {
    'events list ok': (r) => r.status === 200 || r.status === 206,
  })

  const eventId = __ENV.EVENT_ID
  if (eventId) {
    const batch = http.batch([
      ['GET', `${base}/rest/v1/events?select=*&id=eq.${eventId}`, { headers: h, tags: { name: 'event_one' } }],
      ['GET', `${base}/rest/v1/milestones?select=*&event_id=eq.${eventId}&order=due_date.asc`, { headers: h, tags: { name: 'milestones' } }],
      ['GET', `${base}/rest/v1/event_members?select=*&event_id=eq.${eventId}`, { headers: h, tags: { name: 'event_members' } }],
      ['GET', `${base}/rest/v1/announcements?select=*&event_id=eq.${eventId}`, { headers: h, tags: { name: 'announcements' } }],
      ['GET', `${base}/rest/v1/tasks?select=*&event_id=eq.${eventId}`, { headers: h, tags: { name: 'tasks' } }],
    ])
    batch.forEach((r, i) => {
      check(r, {
        [`batch ${i} ok`]: (res) => res.status === 200 || res.status === 206,
      })
    })
  }

  sleep(0.5)
}
