# k6 Load Testing — КупитьСтул

## Установка k6

```bash
# Windows (winget)
winget install k6 --source winget

# Или через Chocolatey
choco install k6

# Или скачать с https://k6.io/docs/getting-started/installation/
```

## Запуск тестов

```bash
# Volume test (нормальная нагрузка)
k6 run tests/load/volume-test.js

# Spike test (резкий всплеск — флэш-распродажа)
k6 run tests/load/spike-test.js

# Stress test (поиск максимума системы)
k6 run tests/load/stress-test.js

# Checkout flow (полный путь покупателя)
k6 run tests/load/checkout-flow.js

# Тест на другом хосте (production/staging)
k6 run tests/load/volume-test.js -e BASE_URL=https://kupitstul.ru
```

## Ключевые метрики (пороги качества)

| Метрика     | Норма   | Критический порог |
| ----------- | ------- | ----------------- |
| TTFB (p95)  | < 200ms | < 500ms           |
| FCP         | < 1.8s  | < 3s              |
| LCP         | < 2.5s  | < 4s              |
| CLS         | < 0.1   | < 0.25            |
| Error rate  | < 0.5%  | < 1%              |
| P95 latency | < 800ms | < 1.5s            |

## Описание сценариев

### `volume-test.js` — Нагрузочный тест

- Постепенный рост: 10 → 30 → 50 пользователей
- Длительность: 7 минут
- Проверяет нормальную работу сайта

### `spike-test.js` — Тест флеш-нагрузки

- Резкий скачок: 5 → 200 пользователей за 15 секунд
- Симулирует: Black Friday, вирусный пост
- Проверяет устойчивость к пиковым нагрузкам

### `stress-test.js` — Стресс-тест

- Линейный рост: 50 → 500 пользователей
- Цель: найти точку отказа системы
- Помогает определить максимальную пропускную способность

### `checkout-flow.js` — Тест сценария покупки

- 20 одновременных пользователей
- Полный путь: главная → каталог → товар → заказ
- Критичный путь для бизнеса (мониторит время создания заказа)
