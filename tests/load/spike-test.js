/**
 * Spike Test — simulates sudden traffic burst (flash sale, viral post).
 * Goes from 5 → 200 users in seconds, then recovers.
 * Run: k6 run tests/load/spike-test.js
 */
import http from "k6/http";
import { check, sleep } from "k6";
import { Rate } from "k6/metrics";

const errorRate = new Rate("errors");

export const options = {
  stages: [
    { duration: "30s", target: 5 }, // baseline
    { duration: "15s", target: 200 }, // sudden spike
    { duration: "1m", target: 200 }, // hold spike
    { duration: "15s", target: 5 }, // recover
    { duration: "1m", target: 5 }, // verify recovery
  ],
  thresholds: {
    http_req_duration: ["p(95)<3000"], // Allow higher latency during spike
    http_req_failed: ["rate<0.05"], // < 5% errors during spike
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

export default function () {
  // During spike, simulate catalogue browsing (most common action)
  const paths = ["/", "/catalog", "/catalog/stulya", "/catalog/barnye-stulya"];
  const path = paths[Math.floor(Math.random() * paths.length)];

  const res = http.get(BASE_URL + path);
  const ok = check(res, {
    "status 200": (r) => r.status === 200,
    "no 503": (r) => r.status !== 503,
    "no 500": (r) => r.status !== 500,
  });
  errorRate.add(!ok);

  sleep(0.5); // minimal think time during spike
}
