!import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

/**
 * GET  /api/test/email
 *   → проверяет текущую SMTP-конфигурацию и отправляет тестовое письмо.
 *   Если SMTP_PASS не задан — создаёт временный Ethereal-аккаунт
 *   (письмо видно только по ссылке previewUrl, до живого ящика не доходит).
 *
 * Query-параметры:
 *   ?to=адрес   (по умолчанию NOTIFY_EMAIL или jobhunter@list.ru)
 *   ?max=1      (дополнительно: отправить тест-сообщение в MAX)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const to =
    searchParams.get("to") || process.env.NOTIFY_EMAIL || "jobhunter@list.ru";
  const testMax = searchParams.get("max") === "1";

  const result: Record<string, any> = {
    config: {
      SMTP_HOST: process.env.SMTP_HOST || "(не задан)",
      SMTP_PORT: process.env.SMTP_PORT || "(не задан)",
      SMTP_SECURE: process.env.SMTP_SECURE || "(не задан)",
      SMTP_USER: process.env.SMTP_USER || "(не задан)",
      SMTP_PASS: process.env.SMTP_PASS
        ? process.env.SMTP_PASS === "ВАШ_ПАРОЛЬ_ОТ_ПОЧТЫ"
          ? "⚠️ НЕ ЗАДАН (placeholder)"
          : "✅ задан"
        : "⚠️ пуст",
      NOTIFY_EMAIL: process.env.NOTIFY_EMAIL || "(не задан)",
      MAX_BOT_TOKEN:
        !process.env.MAX_BOT_TOKEN ||
        process.env.MAX_BOT_TOKEN === "ВАШ_ТОКЕН_БОТА_MAX"
          ? "⚠️ НЕ ЗАДАН"
          : "✅ задан",
      MAX_CHAT_ID:
        !process.env.MAX_CHAT_ID || process.env.MAX_CHAT_ID === "ВАШ_CHAT_ID"
          ? "⚠️ НЕ ЗАДАН"
          : "✅ задан",
    },
  };

  // ─── Email ────────────────────────────────────────────────────────────────
  let transporter: nodemailer.Transporter;
  let usingEthereal = false;
  let previewUrl: string | undefined;

  const realPassSet =
    process.env.SMTP_PASS && process.env.SMTP_PASS !== "ВАШ_ПАРОЛЬ_ОТ_ПОЧТЫ";

  if (realPassSet && process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "465"),
      secure: process.env.SMTP_SECURE !== "false",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Ethereal — временный тестовый аккаунт, не требует реального пароля
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    usingEthereal = true;
    result.warning =
      "SMTP_PASS не задан → использован Ethereal (письмо НЕ дойдёт в реальный ящик). Откройте previewUrl в браузере чтобы увидеть письмо.";
  }

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <h2 style="color:#1f2937">✅ Тестовое письмо — КупитьСтул</h2>
      <p>Если вы видите это письмо — SMTP настроен корректно.</p>
      <table style="width:100%;border-collapse:collapse;margin-top:16px">
        <tr><td style="padding:6px;color:#6b7280">Transport</td><td style="padding:6px"><strong>${usingEthereal ? "Ethereal (тест)" : "Real SMTP (" + process.env.SMTP_HOST + ")"}</strong></td></tr>
        <tr><td style="padding:6px;color:#6b7280">От кого</td><td style="padding:6px">${process.env.SMTP_FROM || process.env.SMTP_USER || "test@ethereal.email"}</td></tr>
        <tr><td style="padding:6px;color:#6b7280">Кому</td><td style="padding:6px">${to}</td></tr>
        <tr><td style="padding:6px;color:#6b7280">Время</td><td style="padding:6px">${new Date().toLocaleString("ru-RU")}</td></tr>
      </table>
      <p style="margin-top:20px;color:#6b7280;font-size:12px">КупитьСтул · тестовое уведомление</p>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from:
        process.env.SMTP_FROM ||
        process.env.SMTP_USER ||
        '"КупитьСтул" <test@ethereal.email>',
      to,
      subject: "✅ Тестовое письмо КупитьСтул",
      html,
    });

    if (usingEthereal) {
      previewUrl = nodemailer.getTestMessageUrl(info) as string;
    }

    result.email = {
      success: true,
      messageId: info.messageId,
      to,
      mode: usingEthereal ? "ethereal" : "real-smtp",
      ...(previewUrl ? { previewUrl } : {}),
    };
  } catch (err: any) {
    result.email = {
      success: false,
      error: err?.message || String(err),
    };
  }

  // ─── MAX ─────────────────────────────────────────────────────────────────
  if (testMax) {
    const botToken = process.env.MAX_BOT_TOKEN;
    const chatId = process.env.MAX_CHAT_ID;

    if (
      !botToken ||
      botToken === "ВАШ_ТОКЕН_БОТА_MAX" ||
      !chatId ||
      chatId === "ВАШ_CHAT_ID"
    ) {
      result.max = {
        success: false,
        error: "MAX_BOT_TOKEN / MAX_CHAT_ID не заданы в .env.local",
      };
    } else {
      try {
        const res = await fetch(
          `https://botapi.max.ru/messages/sendText?access_token=${botToken}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: Number(chatId),
              text: `✅ Тестовое сообщение от КупитьСтул\nSMTP: ${usingEthereal ? "Ethereal" : process.env.SMTP_HOST}\nВремя: ${new Date().toLocaleString("ru-RU")}`,
            }),
          },
        );
        const json = await res.json().catch(() => ({}));
        result.max = { success: res.ok, status: res.status, response: json };
      } catch (err: any) {
        result.max = { success: false, error: err?.message };
      }
    }
  }

  return NextResponse.json(result, { status: 200 });
}
