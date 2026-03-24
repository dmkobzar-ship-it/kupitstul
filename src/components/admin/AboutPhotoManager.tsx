"use client";

import { useEffect, useState } from "react";
import { Save, Image as ImageIcon } from "lucide-react";

export default function AboutPhotoManager() {
  const [teamPhoto, setTeamPhoto] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/about")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.config) {
          setTeamPhoto(d.config.teamPhoto || "");
        }
      })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/about", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamPhoto }),
      });
      const data = await res.json();
      if (data.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch {
      alert("Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <ImageIcon className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-bold text-gray-900">
          Фото команды (страница «О нас»)
        </h3>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        URL изображения для секции «О компании». Рекомендуемый размер: 800×600px.
      </p>

      <div className="flex gap-3">
        <input
          type="text"
          value={teamPhoto}
          onChange={(e) => setTeamPhoto(e.target.value)}
          placeholder="https://images.unsplash.com/..."
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            saved
              ? "bg-green-500 text-white"
              : "bg-gray-900 text-white hover:bg-gray-800"
          } disabled:opacity-50`}
        >
          <Save className="w-4 h-4" />
          {saved ? "Сохранено!" : saving ? "..." : "Сохранить"}
        </button>
      </div>

      {teamPhoto && (
        <div className="mt-4 w-48 h-36 rounded-lg overflow-hidden bg-gray-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={teamPhoto}
            alt="Preview"
            className="w-full h-full object-cover"
          />
        </div>
      )}
    </div>
  );
}
