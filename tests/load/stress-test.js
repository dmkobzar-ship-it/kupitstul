/**
 * Stress Test — find the breaking point by linearly increasing load.
 * Stop increasing once error rate > 5% or p99 > 5s.
 * Run: k6 run tests/load/stress-test.js
 */
import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

const errorRate = new Rate("errors");
const ttfb = new Trend("ttfb");

export const options = {
  stages: [
    { duration: "2m", target: 50 },
    { duration: "2m", target: 100 },
    { duration: "2m", target: 200 },
    { duration: "2m", target: 300 },
    { duration: "2m", target: 400 },
    { duration: "2m", target: 500 },
    { duration: "2m", target: 0 }, // cool down
  ],
  thresholds: {
    // Test FAILS (but continues) when these are breached — helps track breaking point
    http_req_duration: ["p(99)<5000"],
    http_req_failed: ["rate<0.10"],
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

export default function () {
  const paths = [
    "/",
    "/catalog",
    "/catalog/stulya",
    "/api/products?limit=24",
    "/catalog/barnye-stulya",
  ];
  const path = paths[Math.floor(Math.random() * paths.length)];

  const res = http.get(BASE_URL + path);
  ttfb.add(res.timings.waiting);

  const ok = check(res, {
    "no 5xx": (r) => r.status < 500,
    "ttfb < 2s": (r) => r.timings.waiting < 2000,
  });
  errorRate.add(!ok);

  sleep(1);
}
