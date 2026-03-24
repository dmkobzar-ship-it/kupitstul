/**
 * Checkout Flow Test — tests the full customer journey end-to-end.
 * Simulates: homepage → catalog → product → add to cart → checkout → order.
 * Run: k6 run tests/load/checkout-flow.js
 */
import http from "k6/http";
import { check, sleep, group } from "k6";
import { Rate, Trend } from "k6/metrics";

const errorRate = new Rate("checkout_errors");
const orderCreationTime = new Trend("order_creation_time");

export const options = {
  vus: 20, // 20 concurrent users
  duration: "10m", // 10 minutes
  thresholds: {
    http_req_duration: ["p(95)<2000"],
    checkout_errors: ["rate<0.02"], // < 2% order failures
    order_creation_time: ["p(95)<3000"],
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

// Sample product slugs — update with real slugs from your catalog
const SAMPLE_PRODUCTS = [
  "stul-obedenny-kozha",
  "barnyi-stul-cherny",
  "kreslo-soft",
];

export default function () {
  group("1. Homepage", () => {
    const res = http.get(BASE_URL + "/");
    check(res, { "homepage 200": (r) => r.status === 200 });
    sleep(2);
  });

  group("2. Browse catalog", () => {
    const res = http.get(BASE_URL + "/catalog/stulya");
    check(res, { "catalog 200": (r) => r.status === 200 });
    sleep(3);
  });

  group("3. Search products API", () => {
    const res = http.get(BASE_URL + "/api/products?limit=24&category=stulya");
    const ok = check(res, {
      "products API 200": (r) => r.status === 200,
      "products returned": (r) => {
        try {
          const body = JSON.parse(r.body);
          return Array.isArray(body.data) && body.data.length > 0;
        } catch {
          return false;
        }
      },
    });
    errorRate.add(!ok);
    sleep(2);
  });

  group("4. View product page", () => {
    const slug =
      SAMPLE_PRODUCTS[Math.floor(Math.random() * SAMPLE_PRODUCTS.length)];
    const res = http.get(`${BASE_URL}/catalog/product/${slug}`);
    // Product might not exist — 200 or 404 both acceptable
    check(res, { "product page responds": (r) => r.status < 500 });
    sleep(3);
  });

  group("5. Create order (checkout API)", () => {
    const payload = JSON.stringify({
      name: `Test User ${__VU}`,
      phone: "+79991234567",
      email: "test@example.com",
      address: "Москва, Тестовая ул., д. 1",
      items: [
        {
          id: `product-${__VU}`,
          name: "Тестовый стул",
          price: 5990,
          quantity: 1,
          image: "",
        },
      ],
      total: 5990,
      paymentMethod: "card",
      deliveryMethod: "courier",
    });

    const start = Date.now();
    const res = http.post(`${BASE_URL}/api/orders`, payload, {
      headers: { "Content-Type": "application/json" },
    });
    orderCreationTime.add(Date.now() - start);

    const ok = check(res, {
      "order created": (r) => r.status === 200 || r.status === 201,
      "order has id": (r) => {
        try {
          const body = JSON.parse(r.body);
          return !!body.id || !!body.orderId || body.success === true;
        } catch {
          return false;
        }
      },
    });
    errorRate.add(!ok);
    sleep(1);
  });
}
