"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Trash2,
  Save,
  X,
  Edit3,
  Image as ImageIcon,
  RefreshCw,
} from "lucide-react";

interface BlogArticle {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  image: string;
  category: string;
  author: string;
  date: string;
  readTime: string;
  featured: boolean;
  tags: string[];
}

const defaultArticle: Omit<BlogArticle, "id"> = {
  slug: "",
  title: "",
  excerpt: "",
  content: "",
  image: "",
  category: "Советы",
  author: "Редакция КупитьСтул",
  date: new Date().toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }),
  readTime: "5 мин",
  featured: false,
  tags: [],
};

const categoryOptions = [
  "Советы",
  "Тренды",
  "Интерьер",
  "Уход за мебелью",
  "Обзоры",
  "Технологии",
];

export default function BlogManager() {
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [editing, setEditing] = useState<Partial<BlogArticle> | null>(null);
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetch("/api/admin/blog")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setArticles(d.articles || []);
      })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    if (!editing?.title?.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing),
      });
      const data = await res.json();
      if (data.success) {
        setArticles(data.articles);
        setEditing(null);
      }
    } catch {
      alert("Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Удалить статью?")) return;
    try {
      const res = await fetch("/api/admin/blog", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) setArticles(data.articles);
    } catch {
      alert("Ошибка удаления");
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/blog/generate?mode=week");
      const data = await res.json();
      if (data.articles) {
        // Save generated articles to admin storage
        for (const art of data.articles) {
          await fetch("/api/admin/blog", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: art.title,
              slug: art.slug,
              excerpt: art.excerpt,
              content: art.content,
              image: art.image,
              category: art.category,
              author: art.author,
              date: art.date,
              readTime: art.readTime,
              featured: false,
              tags: art.tags || [],
            }),
          });
        }
        // Reload
        const updated = await fetch("/api/admin/blog").then((r) => r.json());
        if (updated.success) setArticles(updated.articles);
        alert(`Сгенерировано ${data.articles.length} статей`);
      }
    } catch {
      alert("Ошибка генерации");
    } finally {
      setGenerating(false);
    }
  };

  const addTag = () => {
    if (!tagInput.trim() || !editing) return;
    const tags = [...(editing.tags || []), tagInput.trim()];
    setEditing({ ...editing, tags });
    setTagInput("");
  };

  const removeTag = (idx: number) => {
    if (!editing) return;
    const tags = (editing.tags || []).filter((_, i) => i !== idx);
    setEditing({ ...editing, tags });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Управление блогом</h2>
          <p className="text-sm text-gray-500">
            {articles.length} статей • Фото и содержимое
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-sm disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${generating ? "animate-spin" : ""}`}
            />
            {generating ? "Генерация..." : "Авто-генерация (неделя)"}
          </button>
          <button
            onClick={() =>
              setEditing({ ...defaultArticle } as Partial<BlogArticle>)
            }
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Новая статья
          </button>
        </div>
      </div>

      {/* Edit form */}
      {editing && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-900">
              {editing.id ? "Редактирование" : "Новая статья"}
            </h3>
            <button
              onClick={() => setEditing(null)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Заголовок *
              </label>
              <input
                type="text"
                value={editing.title || ""}
                onChange={(e) =>
                  setEditing({ ...editing, title: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="Заголовок статьи"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Slug (URL)
              </label>
              <input
                type="text"
                value={editing.slug || ""}
                onChange={(e) =>
                  setEditing({ ...editing, slug: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="auto-generated-from-title"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL изображения
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={editing.image || ""}
                onChange={(e) =>
                  setEditing({ ...editing, image: e.target.value })
                }
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="https://images.unsplash.com/..."
              />
              {editing.image && (
                <div className="w-16 h-10 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={editing.image}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Краткое описание
            </label>
            <textarea
              value={editing.excerpt || ""}
              onChange={(e) =>
                setEditing({ ...editing, excerpt: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              rows={2}
              placeholder="Короткое описание для карточки"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Содержимое статьи
            </label>
            <textarea
              value={editing.content || ""}
              onChange={(e) =>
                setEditing({ ...editing, content: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              rows={6}
              placeholder="Полный текст статьи..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Категория
              </label>
              <select
                value={editing.category || "Советы"}
                onChange={(e) =>
                  setEditing({ ...editing, category: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                {categoryOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Автор
              </label>
              <input
                type="text"
                value={editing.author || ""}
                onChange={(e) =>
                  setEditing({ ...editing, author: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Дата
              </label>
              <input
                type="text"
                value={editing.date || ""}
                onChange={(e) =>
                  setEditing({ ...editing, date: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="1 января 2026"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Время чтения
              </label>
              <input
                type="text"
                value={editing.readTime || ""}
                onChange={(e) =>
                  setEditing({ ...editing, readTime: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="5 мин"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Теги
            </label>
            <div className="flex flex-wrap gap-1 mb-2">
              {(editing.tags || []).map((tag, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full"
                >
                  {tag}
                  <button
                    onClick={() => removeTag(i)}
                    className="hover:text-red-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="Добавить тег..."
              />
              <button
                onClick={addTag}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
              >
                +
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={editing.featured || false}
                onChange={(e) =>
                  setEditing({ ...editing, featured: e.target.checked })
                }
                className="rounded"
              />
              <span className="text-sm text-gray-700">Избранная статья</span>
            </label>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSave}
              disabled={saving || !editing.title?.trim()}
              className="flex items-center gap-2 px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? "Сохранение..." : "Сохранить"}
            </button>
            <button
              onClick={() => setEditing(null)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Articles list */}
      <div className="space-y-3">
        {articles.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-2">Статей пока нет</p>
            <p className="text-sm text-gray-400">
              Нажмите «Новая статья» или «Авто-генерация» для создания
            </p>
          </div>
        )}
        {articles.map((article) => (
          <div
            key={article.id}
            className="bg-white border border-gray-200 rounded-xl p-4 flex items-start gap-4"
          >
            <div className="w-20 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
              {article.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={article.image}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="w-6 h-6 text-gray-300" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-medium text-gray-900 truncate">
                    {article.title}
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {article.category} • {article.author} • {article.date}
                    {article.featured && (
                      <span className="ml-2 text-amber-600 font-medium">
                        ★ Избранная
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => setEditing({ ...article })}
                    className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-700"
                    title="Редактировать"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(article.id)}
                    className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-600"
                    title="Удалить"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                {article.excerpt}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
