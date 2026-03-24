"use client";

import { useState, useEffect, useRef } from "react";
import {
  ImageIcon,
  Save,
  Check,
  Loader2,
  Plus,
  Trash2,
  GripVertical,
  Upload,
  Image as ImageLucide,
  Layers,
  Layout,
} from "lucide-react";

interface HeroSlide {
  url: string;
  alt: string;
  animation: string;
}
interface CategoryCard {
  id: string;
  name: string;
  count: number;
  href: string;
  image: string;
}
interface Collection {
  id: string;
  name: string;
  description: string;
  href: string;
  image: string;
}
interface HomepageConfig {
  heroSlides: HeroSlide[];
  categories: CategoryCard[];
  collections: Collection[];
}

const ANIMATIONS = [
  { value: "zoom-in-left", label: "Приближение слева" },
  { value: "zoom-in-right", label: "Приближение справа" },
  { value: "zoom-in-center", label: "Приближение к центру" },
  { value: "pan-left", label: "Панорама влево" },
  { value: "pan-right", label: "Панорама вправо" },
  { value: "zoom-out", label: "Отдаление" },
];

export default function HomepageManager() {
  const [config, setConfig] = useState<HomepageConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [section, setSection] = useState<"hero" | "categories" | "collections">(
    "hero",
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTarget, setUploadTarget] = useState<{
    section: string;
    index: number;
  } | null>(null);

  useEffect(() => {
    fetch("/api/admin/homepage")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setConfig(d.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/homepage", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (data.success) {
        setConfig(data.data);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (files: FileList) => {
    if (!uploadTarget || !config) return;
    const file = files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload-file", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        const newConfig = { ...config };
        if (uploadTarget.section === "hero") {
          newConfig.heroSlides = [...newConfig.heroSlides];
          newConfig.heroSlides[uploadTarget.index] = {
            ...newConfig.heroSlides[uploadTarget.index],
            url: data.url,
          };
        } else if (uploadTarget.section === "categories") {
          newConfig.categories = [...newConfig.categories];
          newConfig.categories[uploadTarget.index] = {
            ...newConfig.categories[uploadTarget.index],
            image: data.url,
          };
        } else if (uploadTarget.section === "collections") {
          newConfig.collections = [...newConfig.collections];
          newConfig.collections[uploadTarget.index] = {
            ...newConfig.collections[uploadTarget.index],
            image: data.url,
          };
        }
        setConfig(newConfig);
      }
    } catch (e) {
      console.error("Upload error:", e);
    }
    setUploadTarget(null);
  };

  if (loading || !config) {
    return (
      <div className="flex items-center justify-center p-12 text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Загрузка...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section tabs */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {[
            {
              id: "hero" as const,
              label: "Галерея героя",
              icon: ImageLucide,
            },
            {
              id: "categories" as const,
              label: "Категории",
              icon: Layout,
            },
            {
              id: "collections" as const,
              label: "Коллекции",
              icon: Layers,
            },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setSection(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                section === t.id
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-bold disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saved ? (
            <Check className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saved ? "Сохранено!" : "Сохранить всё"}
        </button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleFileUpload(e.target.files);
          e.target.value = "";
        }}
      />

      {/* Hero slides */}
      {section === "hero" && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                <ImageLucide className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Слайды героя
                </h3>
                <p className="text-sm text-gray-500">
                  Изображения, которые крутятся на главной странице
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setConfig({
                  ...config,
                  heroSlides: [
                    ...config.heroSlides,
                    {
                      url: "",
                      alt: "Новый слайд",
                      animation: "zoom-in-center",
                    },
                  ],
                });
              }}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Добавить слайд
            </button>
          </div>

          <div className="space-y-4">
            {config.heroSlides.map((slide, i) => (
              <div
                key={i}
                className="flex items-start gap-4 p-4 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
              >
                <GripVertical className="w-5 h-5 text-gray-300 mt-3 flex-shrink-0" />

                {/* Preview */}
                <div
                  className="w-32 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer group relative"
                  onClick={() => {
                    setUploadTarget({ section: "hero", index: i });
                    fileInputRef.current?.click();
                  }}
                >
                  {slide.url ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={slide.url}
                        alt={slide.alt}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Upload className="w-5 h-5 text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <Upload className="w-6 h-6" />
                    </div>
                  )}
                </div>

                {/* Fields */}
                <div className="flex-1 space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={slide.url}
                      onChange={(e) => {
                        const s = [...config.heroSlides];
                        s[i] = { ...s[i], url: e.target.value };
                        setConfig({ ...config, heroSlides: s });
                      }}
                      placeholder="URL изображения"
                      className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    />
                    <select
                      value={slide.animation}
                      onChange={(e) => {
                        const s = [...config.heroSlides];
                        s[i] = { ...s[i], animation: e.target.value };
                        setConfig({ ...config, heroSlides: s });
                      }}
                      className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-700"
                    >
                      {ANIMATIONS.map((a) => (
                        <option key={a.value} value={a.value}>
                          {a.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <input
                    type="text"
                    value={slide.alt}
                    onChange={(e) => {
                      const s = [...config.heroSlides];
                      s[i] = { ...s[i], alt: e.target.value };
                      setConfig({ ...config, heroSlides: s });
                    }}
                    placeholder="Описание (alt)"
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  />
                </div>

                {/* Delete */}
                <button
                  onClick={() => {
                    const s = config.heroSlides.filter((_, j) => j !== i);
                    setConfig({ ...config, heroSlides: s });
                  }}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors mt-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Categories */}
      {section === "categories" && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <Layout className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Категории на главной
                </h3>
                <p className="text-sm text-gray-500">
                  Плитки категорий в секции &quot;Каталог по категориям&quot;
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setConfig({
                  ...config,
                  categories: [
                    ...config.categories,
                    {
                      id: `cat-${Date.now()}`,
                      name: "Новая категория",
                      count: 0,
                      href: "/catalog",
                      image: "",
                    },
                  ],
                });
              }}
              className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Добавить
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {config.categories.map((cat, i) => (
              <div
                key={i}
                className="flex items-start gap-4 p-4 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
              >
                {/* Preview */}
                <div
                  className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer group relative"
                  onClick={() => {
                    setUploadTarget({ section: "categories", index: i });
                    fileInputRef.current?.click();
                  }}
                >
                  {cat.image ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={cat.image}
                        alt={cat.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Upload className="w-5 h-5 text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <Upload className="w-6 h-6" />
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={cat.name}
                    onChange={(e) => {
                      const c = [...config.categories];
                      c[i] = { ...c[i], name: e.target.value };
                      setConfig({ ...config, categories: c });
                    }}
                    placeholder="Название"
                    className="w-full text-sm font-medium border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={cat.href}
                      onChange={(e) => {
                        const c = [...config.categories];
                        c[i] = { ...c[i], href: e.target.value };
                        setConfig({ ...config, categories: c });
                      }}
                      placeholder="/catalog/stulya"
                      className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    />
                    <input
                      type="number"
                      value={cat.count}
                      onChange={(e) => {
                        const c = [...config.categories];
                        c[i] = {
                          ...c[i],
                          count: parseInt(e.target.value) || 0,
                        };
                        setConfig({ ...config, categories: c });
                      }}
                      placeholder="Кол-во"
                      className="w-20 text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <input
                    type="text"
                    value={cat.image}
                    onChange={(e) => {
                      const c = [...config.categories];
                      c[i] = { ...c[i], image: e.target.value };
                      setConfig({ ...config, categories: c });
                    }}
                    placeholder="URL изображения"
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  />
                </div>

                <button
                  onClick={() => {
                    const c = config.categories.filter((_, j) => j !== i);
                    setConfig({ ...config, categories: c });
                  }}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Collections */}
      {section === "collections" && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                <Layers className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Коллекции</h3>
                <p className="text-sm text-gray-500">
                  Секции коллекций на главной (Для ресторанов, Для дома, и т.д.)
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setConfig({
                  ...config,
                  collections: [
                    ...config.collections,
                    {
                      id: `col-${Date.now()}`,
                      name: "Новая коллекция",
                      description: "Описание",
                      href: "/catalog",
                      image: "",
                    },
                  ],
                });
              }}
              className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Добавить
            </button>
          </div>

          <div className="space-y-4">
            {config.collections.map((col, i) => (
              <div
                key={i}
                className="flex items-start gap-4 p-4 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
              >
                {/* Preview */}
                <div
                  className="w-36 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer group relative"
                  onClick={() => {
                    setUploadTarget({ section: "collections", index: i });
                    fileInputRef.current?.click();
                  }}
                >
                  {col.image ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={col.image}
                        alt={col.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Upload className="w-5 h-5 text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <Upload className="w-6 h-6" />
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={col.name}
                      onChange={(e) => {
                        const c = [...config.collections];
                        c[i] = { ...c[i], name: e.target.value };
                        setConfig({ ...config, collections: c });
                      }}
                      placeholder="Название"
                      className="flex-1 text-sm font-medium border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    />
                    <input
                      type="text"
                      value={col.href}
                      onChange={(e) => {
                        const c = [...config.collections];
                        c[i] = { ...c[i], href: e.target.value };
                        setConfig({ ...config, collections: c });
                      }}
                      placeholder="Ссылка"
                      className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <input
                    type="text"
                    value={col.description}
                    onChange={(e) => {
                      const c = [...config.collections];
                      c[i] = { ...c[i], description: e.target.value };
                      setConfig({ ...config, collections: c });
                    }}
                    placeholder="Описание"
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  />
                  <input
                    type="text"
                    value={col.image}
                    onChange={(e) => {
                      const c = [...config.collections];
                      c[i] = { ...c[i], image: e.target.value };
                      setConfig({ ...config, collections: c });
                    }}
                    placeholder="URL изображения"
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  />
                </div>

                <button
                  onClick={() => {
                    const c = config.collections.filter((_, j) => j !== i);
                    setConfig({ ...config, collections: c });
                  }}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
