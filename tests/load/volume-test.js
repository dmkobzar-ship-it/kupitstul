/**
 * Volume Test — gradual ramp-up to 50 concurrent users, 5 minutes.
 * Tests normal expected traffic. All key pages checked.
 * Run: k6 run tests/load/volume-test.js
 */
import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

const errorRate = new Rate("errors");
const pageLoadTime = new Trend("page_load_time");

export const options = {
  stages: [
    { duration: "1m", target: 10 }, // warm-up
    { duration: "2m", target: 30 }, // ramp-up
    { duration: "3m", target: 50 }, // sustained load
    { duration: "1m", target: 0 }, // ramp-down
  ],
  thresholds: {
    http_req_duration: ["p(95)<800", "p(99)<1500"],
    http_req_failed: ["rate<0.01"], // < 1% errors
    errors: ["rate<0.01"],
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

// Realistic user flows
const PAGES = [
  { url: "/", weight: 20 },
  { url: "/catalog", weight: 25 },
  { url: "/catalog/stulya", weight: 15 },
  { url: "/catalog/barnye-stulya", weight: 10 },
  { url: "/catalog/stoly", weight: 10 },
  { url: "/catalog/kresla", weight: 10 },
  { url: "/sale", weight: 5 },
  { url: "/blog", weight: 3 },
  { url: "/dostavka", weight: 2 },
];

function weightedRandomPage() {
  const total = PAGES.reduce((acc, p) => acc + p.weight, 0);
  let r = Math.random() * total;
  for (const page of PAGES) {
    r -= page.weight;
    if (r <= 0) return page.url;
  }
  return PAGES[0].url;
}

export default function () {
  const url = BASE_URL + weightedRandomPage();
  const start = Date.now();
  const res = http.get(url, { tags: { page: url } });
  pageLoadTime.add(Date.now() - start);

  const ok = check(res, {
    "status 200": (r) => r.status === 200,
    "no server error": (r) => r.status < 500,
    "response time < 2s": (r) => r.timings.duration < 2000,
  });
  errorRate.add(!ok);

  sleep(Math.random() * 3 + 1); // think time 1-4s
}
