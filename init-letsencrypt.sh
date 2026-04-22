#!/usr/bin/env bash
# =============================================================================
# init-letsencrypt.sh — Первоначальное получение сертификата Let's Encrypt
#
# Запускать ОДИН РАЗ на сервере перед docker compose -f docker-compose.prod.yml up -d
#
# Использование:
#   chmod +x init-letsencrypt.sh
#   ./init-letsencrypt.sh
#
# Для тестирования без лимитов Let's Encrypt (staging):
#   STAGING=1 ./init-letsencrypt.sh
# =============================================================================

set -e

# ── Настройки ────────────────────────────────────────────────────────────────
DOMAIN="kupitstul.ru"
EXTRA_DOMAINS="www.kupitstul.ru"   # доп. домены через пробел (или пустая строка)
EMAIL="admin@kupitstul.ru"         # ← замени на свой email
STAGING="${STAGING:-0}"            # 1 = тестовый режим (без реального cert)
COMPOSE="docker compose -f docker-compose.prod.yml"

# ── Проверка Docker ───────────────────────────────────────────────────────────
if ! command -v docker &>/dev/null; then
  echo "❌  Docker не установлен. Установи: https://docs.docker.com/engine/install/"
  exit 1
fi

echo "╔══════════════════════════════════════════════════════╗"
echo "║  КупитьСтул — Let's Encrypt инициализация           ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
echo "  Домен : $DOMAIN"
echo "  Email : $EMAIL"
echo "  Staging: $STAGING"
echo ""

# ── Шаг 1: Скачать рекомендованные настройки SSL от Certbot ──────────────────
echo "▶  Загружаем рекомендованные SSL-параметры..."
CONF_DIR="$(docker volume inspect kupitstul_certbot_conf --format '{{.Mountpoint}}' 2>/dev/null || echo '')"

# Создаём тома заранее
$COMPOSE run --rm --no-deps certbot true 2>/dev/null || true
docker volume create kupitstul_certbot_conf  2>/dev/null || true
docker volume create kupitstul_certbot_www   2>/dev/null || true

# Скачиваем options-ssl-nginx.conf и ssl-dhparams.pem от certbot (нужны nginx'у)
docker run --rm \
  -v kupitstul_certbot_conf:/etc/letsencrypt \
  certbot/certbot:latest \
  /bin/sh -c '
    if [ ! -f /etc/letsencrypt/options-ssl-nginx.conf ]; then
      curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf \
        -o /etc/letsencrypt/options-ssl-nginx.conf
    fi
    if [ ! -f /etc/letsencrypt/ssl-dhparams.pem ]; then
      curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem \
        -o /etc/letsencrypt/ssl-dhparams.pem
    fi
  '

# ── Шаг 2: Временный заглушка-сертификат, чтобы nginx стартовал ──────────────
echo "▶  Создаём временный самоподписанный сертификат..."
docker run --rm \
  -v kupitstul_certbot_conf:/etc/letsencrypt \
  alpine/openssl \
  req -x509 -nodes -newkey rsa:2048 -days 1 \
  -keyout /etc/letsencrypt/live/${DOMAIN}/privkey.pem \
  -out    /etc/letsencrypt/live/${DOMAIN}/fullchain.pem \
  -subj   "/CN=localhost" 2>/dev/null || \
docker run --rm \
  -v kupitstul_certbot_conf:/etc/letsencrypt \
  certbot/certbot:latest \
  /bin/sh -c "mkdir -p /etc/letsencrypt/live/${DOMAIN} && \
    openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
    -keyout /etc/letsencrypt/live/${DOMAIN}/privkey.pem \
    -out    /etc/letsencrypt/live/${DOMAIN}/fullchain.pem \
    -subj '/CN=localhost' 2>/dev/null && \
    cp /etc/letsencrypt/live/${DOMAIN}/fullchain.pem /etc/letsencrypt/live/${DOMAIN}/chain.pem"

# ── Шаг 3: Запускаем только nginx (с временным cert) ─────────────────────────
echo "▶  Запускаем nginx для прохождения ACME-challenge..."
$COMPOSE up -d --no-deps nginx
sleep 3

# ── Шаг 4: Получаем реальный сертификат через webroot ────────────────────────
echo "▶  Запрашиваем сертификат Let's Encrypt..."

STAGING_FLAG=""
if [ "$STAGING" = "1" ]; then
  STAGING_FLAG="--staging"
  echo "   ⚠  STAGING режим — сертификат не будет доверенным"
fi

DOMAIN_ARGS="-d ${DOMAIN}"
for d in $EXTRA_DOMAINS; do
  DOMAIN_ARGS="${DOMAIN_ARGS} -d ${d}"
done

$COMPOSE run --rm --no-deps certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  $STAGING_FLAG \
  --email "$EMAIL" \
  --agree-tos \
  --no-eff-email \
  --force-renewal \
  $DOMAIN_ARGS

# ── Шаг 5: Перезагружаем nginx с реальным сертификатом ───────────────────────
echo "▶  Перезагружаем nginx с реальным сертификатом..."
$COMPOSE exec nginx nginx -s reload

# ── Шаг 6: Запускаем все остальные сервисы ───────────────────────────────────
echo "▶  Запускаем все сервисы..."
$COMPOSE up -d

echo ""
echo "✅  Готово! Сайт доступен по адресу: https://${DOMAIN}"
echo ""
echo "Полезные команды:"
echo "  Статус:   $COMPOSE ps"
echo "  Логи:     $COMPOSE logs -f"
echo "  Остановка: $COMPOSE down"
echo "  Обновить cert вручную: $COMPOSE run --rm certbot renew"
