"use client";

import { useState, useEffect } from "react";
import { ImageIcon, Save, Check, X, Loader2 } from "lucide-react";

const ALL_CATEGORIES = [
  { slug: "stulya", name: "Стулья" },
  { slug: "barnye-stulya", name: "Барные стулья" },
  { slug: "stoly", name: "Столы" },
  { slug: "kresla", name: "Кресла" },
  { slug: "divany", name: "Диваны" },
  { slug: "krovati", name: "Кровати" },
  { slug: "pufy", name: "Пуфы и банкетки" },
  { slug: "komody", name: "Комоды" },
  { slug: "kompyuternye-kresla", name: "Компьютерные кресла" },
  { slug: "stellazhi", name: "Стеллажи" },
  { slug: "shkafy", name: "Шкафы" },
  { slug: "tumby", name: "Тумбы" },
  { slug: "tumby-tv", name: "Тумбы ТВ" },
  { slug: "osveschenie", name: "Освещение" },
  { slug: "banketki", name: "Банкетки" },
];

export default function CategoryImageManager() {
  const [images, setImages] = useState<Record<string, string>>({});
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [editUrl, setEditUrl] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/category-images")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setImages(d.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (slug: string) => {
    setSaving(slug);
    try {
      const res = await fetch("/api/admin/category-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, imageUrl: editUrl.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setImages(data.data);
        setSaved(slug);
        setTimeout(() => setSaved(null), 2000);
      }
    } catch {
      // ignore
    } finally {
      setSaving(null);
      setEditingSlug(null);
      setEditUrl("");
    }
  };

  const handleRemove = async (slug: string) => {
    setSaving(slug);
    try {
      const res = await fetch("/api/admin/category-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, imageUrl: "" }),
      });
      const data = await res.json();
      if (data.success) setImages(data.data);
    } catch {
      // ignore
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Загрузка...
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
          <ImageIcon className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">
            Картинки категорий
          </h3>
          <p className="text-sm text-gray-500">
            Укажите URL изображения для каждой категории
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {ALL_CATEGORIES.map((cat) => {
          const currentUrl = images[cat.slug];
          const isEditing = editingSlug === cat.slug;
          const isSaving = saving === cat.slug;
          const justSaved = saved === cat.slug;

          return (
            <div
              key={cat.slug}
              className="flex items-center gap-4 p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
            >
              {/* Preview */}
              <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                {currentUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={currentUrl}
                    alt={cat.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900">{cat.name}</div>
                <div className="text-xs text-gray-400">{cat.slug}</div>
                {currentUrl && !isEditing && (
                  <div className="text-xs text-gray-500 truncate mt-0.5">
                    {currentUrl}
                  </div>
                )}
                {isEditing && (
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="text"
                      value={editUrl}
                      onChange={(e) => setEditUrl(e.target.value)}
                      placeholder="https://..."
                      className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSave(cat.slug);
                        if (e.key === "Escape") {
                          setEditingSlug(null);
                          setEditUrl("");
                        }
                      }}
                    />
                    <button
                      onClick={() => handleSave(cat.slug)}
                      disabled={isSaving}
                      className="p-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                    >
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setEditingSlug(null);
                        setEditUrl("");
                      }}
                      className="p-1.5 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Actions */}
              {!isEditing && (
                <div className="flex items-center gap-2">
                  {justSaved && (
                    <span className="text-green-500 text-sm flex items-center gap-1">
                      <Check className="w-4 h-4" /> Сохранено
                    </span>
                  )}
                  <button
                    onClick={() => {
                      setEditingSlug(cat.slug);
                      setEditUrl(currentUrl || "");
                    }}
                    className="px-3 py-1.5 text-sm bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors font-medium"
                  >
                    {currentUrl ? "Изменить" : "Добавить"}
                  </button>
                  {currentUrl && (
                    <button
                      onClick={() => handleRemove(cat.slug)}
                      disabled={isSaving}
                      className="px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium disabled:opacity-50"
                    >
                      Удалить
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
