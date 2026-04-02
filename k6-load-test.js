/**
 * Owambe Load Test — k6
 *
 * Run: k6 run k6-load-test.js --env BASE_URL=https://api.owambe.com
 * Or:  k6 run k6-load-test.js (defaults to localhost)
 *
 * Install k6: https://k6.io/docs/getting-started/installation/
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// ─── CONFIG ──────────────────────────────────────────
const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000';

export const options = {
  scenarios: {
    // Ramp up to 100 concurrent users over 2 minutes, hold for 5 minutes
    sustained_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 100 },   // Ramp up
        { duration: '5m', target: 100 },   // Hold at 100
        { duration: '2m', target: 200 },   // Spike test
        { duration: '2m', target: 100 },   // Back to normal
        { duration: '1m', target: 0 },     // Ramp down
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],  // 95% under 500ms
    http_req_failed: ['rate<0.01'],                   // Less than 1% errors
    'vendor_search_duration': ['p(95)<300'],           // Search must be fast
    'event_create_duration': ['p(95)<800'],
  },
};

// ─── CUSTOM METRICS ───────────────────────────────────
const vendorSearchDuration = new Trend('vendor_search_duration');
const eventCreateDuration = new Trend('event_create_duration');
const checkInDuration = new Trend('checkin_duration');
const errorRate = new Rate('error_rate');
const requestCount = new Counter('request_count');

// ─── TEST DATA ────────────────────────────────────────
const TEST_PLANNER = { email: 'planner@test.com', password: 'Planner123!' };

// ─── SETUP ───────────────────────────────────────────
export function setup() {
  // Login and get token
  const res = http.post(`${BASE_URL}/api/auth/login`,
    JSON.stringify(TEST_PLANNER),
    { headers: { 'Content-Type': 'application/json' } }
  );

  if (res.status !== 200) {
    throw new Error(`Login failed: ${res.status} ${res.body}`);
  }

  const body = JSON.parse(res.body as string);
  return { token: body.accessToken };
}

// ─── MAIN TEST ───────────────────────────────────────
export default function main(data: { token: string }) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${data.token}`,
  };

  requestCount.add(1);

  group('Health Check', () => {
    const res = http.get(`${BASE_URL}/health`);
    check(res, { 'health ok': r => r.status === 200 });
  });

  sleep(0.5);

  group('Vendor Search', () => {
    const start = Date.now();
    const res = http.get(
      `${BASE_URL}/api/vendors/search?category=PHOTOGRAPHY_VIDEO&city=Lagos&limit=20`,
      { headers }
    );
    vendorSearchDuration.add(Date.now() - start);
    errorRate.add(res.status !== 200);
    check(res, {
      'vendor search 200': r => r.status === 200,
      'has vendors array': r => JSON.parse(r.body as string)?.vendors !== undefined,
    });
  });

  sleep(0.5);

  group('Planner Dashboard', () => {
    const res = http.get(`${BASE_URL}/api/analytics/planner/overview`, { headers });
    check(res, { 'overview 200': r => r.status === 200 });
  });

  sleep(0.5);

  group('Events List', () => {
    const res = http.get(`${BASE_URL}/api/events?limit=10`, { headers });
    check(res, { 'events 200': r => r.status === 200 });
  });

  sleep(1);
}

// ─── TEARDOWN ─────────────────────────────────────────
export function teardown(data: { token: string }) {
  http.post(`${BASE_URL}/api/auth/logout`,
    null,
    { headers: { 'Authorization': `Bearer ${data.token}` } }
  );
  console.log('Load test complete. Check thresholds above.');
}
