"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";

export default function BlogSubscribeForm() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email && !phone) return;

    setSending(true);
    try {
      await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "subscribe",
          data: { email, phone },
        }),
      });
      setSent(true);
      setEmail("");
      setPhone("");
      setTimeout(() => setSent(false), 5000);
    } catch {
      // ignore
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="flex items-center gap-3 text-green-400">
        <Check className="w-6 h-6" />
        <span className="font-medium">Вы успешно подписались!</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Ваш email"
          className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-gray-500 focus:outline-none focus:border-[var(--color-accent)]"
        />
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Телефон"
          className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-gray-500 focus:outline-none focus:border-[var(--color-accent)]"
        />
      </div>
      <button
        type="submit"
        disabled={sending || (!email && !phone)}
        className="btn-accent whitespace-nowrap w-full sm:w-auto disabled:opacity-50"
      >
        {sending ? (
          <span className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Отправка...
          </span>
        ) : (
          "Подписаться"
        )}
      </button>
    </form>
  );
}
