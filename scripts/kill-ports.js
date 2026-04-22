/**
 * kill-ports.js
 * Проверяет порты перед запуском dev-сервера.
 * Если порт занят — находит PID через netstat и убивает процесс.
 * Запускается автоматически через npm predev.
 */

const { execSync } = require("child_process");
const net = require("net");

// Порты, которые должны быть свободны перед запуском
const PORTS = [3000, 3002];

function isPortBusy(port) {
  return new Promise((resolve) => {
    const tester = net.createServer();
    tester.once("error", (err) => resolve(err.code === "EADDRINUSE"));
    tester.once("listening", () => {
      tester.close();
      resolve(false);
    });
    // Тестируем 0.0.0.0 — именно так слушает Node/Next.js
    tester.listen(port, "0.0.0.0");
  });
}

function killPort(port) {
  try {
    const output = execSync(`netstat -ano`, { encoding: "utf8" });
    const lines = output.trim().split("\n");
    const pids = new Set();

    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      // Формат: Proto  LocalAddr  ForeignAddr  State  PID
      const localAddr = parts[1] || "";
      const pid = parts[parts.length - 1];
      if (
        (localAddr === `0.0.0.0:${port}` ||
          localAddr === `[::]:${port}` ||
          localAddr === `127.0.0.1:${port}`) &&
        /^\d+$/.test(pid) &&
        pid !== "0"
      ) {
        pids.add(pid);
      }
    }

    if (pids.size === 0) {
      console.log(`  ⚠  PID для порта ${port} не найден — пропускаем`);
      return;
    }

    for (const pid of pids) {
      try {
        execSync(`taskkill /F /PID ${pid}`, { stdio: "pipe" });
        console.log(`  ✅ Убит процесс PID ${pid} (порт ${port})`);
      } catch {
        console.log(`  ⚠  Не удалось убить PID ${pid} (уже завершён?)`);
      }
    }
  } catch (err) {
    console.log(`  ⚠  Не удалось выполнить netstat: ${err.message}`);
  }
}

async function main() {
  console.log("🔍 Проверка портов перед запуском...");
  let killed = 0;

  for (const port of PORTS) {
    const busy = await isPortBusy(port);
    if (busy) {
      console.log(`⚡ Порт ${port} занят — освобождаем...`);
      killPort(port);
      killed++;
    } else {
      console.log(`✓  Порт ${port} свободен`);
    }
  }

  if (killed > 0) {
    // Даём ОС время убрать сокеты
    await new Promise((r) => setTimeout(r, 600));
  }

  console.log("🚀 Запускаем серверы...\n");
}

main().catch((err) => {
  console.error("kill-ports error:", err.message);
  // Не прерываем npm run dev при ошибке скрипта
  process.exit(0);
});
