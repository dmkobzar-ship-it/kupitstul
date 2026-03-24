"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Plus,
  X,
  GripVertical,
  Upload,
  Video,
  Eye,
  Save,
  ImagePlus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Star,
  Tag,
  Package,
  Palette,
  Ruler,
  Weight,
  Shield,
  Globe,
  Layers,
  Armchair,
} from "lucide-react";

// ===== Available parameters for sidebar =====
interface ParamDef {
  id: string;
  name: string;
  icon: React.ElementType;
  group: string;
  type: "text" | "number" | "select" | "boolean" | "color";
  unit?: string;
  options?: string[];
  placeholder?: string;
}

const AVAILABLE_PARAMS: ParamDef[] = [
  // Основные
  {
    id: "brand",
    name: "Бренд",
    icon: Tag,
    group: "Основные",
    type: "text",
    placeholder: "Например: IKEA",
  },
  {
    id: "country",
    name: "Страна производства",
    icon: Globe,
    group: "Основные",
    type: "select",
    options: [
      "Россия",
      "Китай",
      "Италия",
      "Германия",
      "Турция",
      "Беларусь",
      "Польша",
      "Индия",
      "Вьетнам",
    ],
  },
  {
    id: "warranty",
    name: "Гарантия (мес)",
    icon: Shield,
    group: "Основные",
    type: "number",
    unit: "мес",
    placeholder: "24",
  },
  {
    id: "sku",
    name: "Артикул",
    icon: Package,
    group: "Основные",
    type: "text",
    placeholder: "CHAIR-001",
  },
  // Размеры
  {
    id: "width",
    name: "Ширина",
    icon: Ruler,
    group: "Размеры",
    type: "number",
    unit: "см",
    placeholder: "45",
  },
  {
    id: "height",
    name: "Высота",
    icon: Ruler,
    group: "Размеры",
    type: "number",
    unit: "см",
    placeholder: "90",
  },
  {
    id: "depth",
    name: "Глубина",
    icon: Ruler,
    group: "Размеры",
    type: "number",
    unit: "см",
    placeholder: "50",
  },
  {
    id: "seat_height",
    name: "Высота сиденья",
    icon: Ruler,
    group: "Размеры",
    type: "number",
    unit: "см",
    placeholder: "47",
  },
  {
    id: "weight",
    name: "Вес",
    icon: Weight,
    group: "Размеры",
    type: "number",
    unit: "кг",
    placeholder: "5.5",
  },
  {
    id: "max_load",
    name: "Макс. нагрузка",
    icon: Weight,
    group: "Размеры",
    type: "number",
    unit: "кг",
    placeholder: "120",
  },
  // Материалы
  {
    id: "frame_material",
    name: "Материал каркаса",
    icon: Layers,
    group: "Материалы",
    type: "select",
    options: [
      "Дерево",
      "Металл",
      "Пластик",
      "Фанера",
      "МДФ",
      "ДСП",
      "Бамбук",
      "Ротанг",
    ],
  },
  {
    id: "seat_material",
    name: "Материал сиденья",
    icon: Armchair,
    group: "Материалы",
    type: "select",
    options: [
      "Ткань",
      "Экокожа",
      "Натуральная кожа",
      "Велюр",
      "Микрофибра",
      "Дерево",
      "Пластик",
      "Сетка",
    ],
  },
  {
    id: "upholstery",
    name: "Обивка",
    icon: Layers,
    group: "Материалы",
    type: "text",
    placeholder: "Велюр Milano",
  },
  // Внешний вид
  {
    id: "color",
    name: "Цвет",
    icon: Palette,
    group: "Внешний вид",
    type: "color",
    placeholder: "#000000",
  },
  {
    id: "color_name",
    name: "Название цвета",
    icon: Palette,
    group: "Внешний вид",
    type: "text",
    placeholder: "Графитовый серый",
  },
  {
    id: "style",
    name: "Стиль",
    icon: Star,
    group: "Внешний вид",
    type: "select",
    options: [
      "Модерн",
      "Лофт",
      "Скандинавский",
      "Классика",
      "Минимализм",
      "Прованс",
      "Хай-тек",
      "Барокко",
    ],
  },
  // Комфорт
  {
    id: "adjustable_height",
    name: "Регулировка высоты",
    icon: Ruler,
    group: "Комфорт",
    type: "boolean",
  },
  {
    id: "foldable",
    name: "Складной",
    icon: Package,
    group: "Комфорт",
    type: "boolean",
  },
  {
    id: "armrest",
    name: "Подлокотники",
    icon: Armchair,
    group: "Комфорт",
    type: "boolean",
  },
  {
    id: "swivel",
    name: "Вращение",
    icon: Armchair,
    group: "Комфорт",
    type: "boolean",
  },
  {
    id: "wheels",
    name: "На колёсиках",
    icon: Armchair,
    group: "Комфорт",
    type: "boolean",
  },
];

interface AddedParam {
  id: string;
  value: string;
}

interface ProductForm {
  name: string;
  slug: string;
  description: string;
  price: string;
  originalPrice: string;
  category: string;
  tags: string;
  inStock: boolean;
  stockCount: string;
  images: string[];
  videos: string[];
  params: AddedParam[];
}

const CATEGORIES = [
  "barnye-stulya",
  "stulya",
  "stoly",
  "kresla",
  "kompyuternye-kresla",
  "ofisnye-stulya",
  "taburetki",
  "komody",
  "stellazhi",
  "tumby",
  "tumby-tv",
  "shkafy",
  "pufy",
  "zerkala",
  "sadovaya-mebel",
];

function slugify(text: string): string {
  const tr: Record<string, string> = {
    а: "a",
    б: "b",
    в: "v",
    г: "g",
    д: "d",
    е: "e",
    ё: "yo",
    ж: "zh",
    з: "z",
    и: "i",
    й: "j",
    к: "k",
    л: "l",
    м: "m",
    н: "n",
    о: "o",
    п: "p",
    р: "r",
    с: "s",
    т: "t",
    у: "u",
    ф: "f",
    х: "h",
    ц: "c",
    ч: "ch",
    ш: "sh",
    щ: "sch",
    ъ: "",
    ы: "y",
    ь: "",
    э: "e",
    ю: "yu",
    я: "ya",
  };
  return text
    .toLowerCase()
    .split("")
    .map((c) => tr[c] || c)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function AdminNewProductPage() {
  const [form, setForm] = useState<ProductForm>({
    name: "",
    slug: "",
    description: "",
    price: "",
    originalPrice: "",
    category: CATEGORIES[0],
    tags: "",
    inStock: true,
    stockCount: "10",
    images: [],
    videos: [],
    params: [],
  });
  const [previewMode, setPreviewMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {
      Основные: true,
      Размеры: false,
      Материалы: false,
      "Внешний вид": false,
      Комфорт: false,
    },
  );
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [dragItem, setDragItem] = useState<number | null>(null);

  // File input refs
  const photoInputRef = useCallback((node: HTMLInputElement | null) => {
    if (node) node.setAttribute("data-photo-input", "true");
  }, []);
  const videoInputRef = useCallback((node: HTMLInputElement | null) => {
    if (node) node.setAttribute("data-video-input", "true");
  }, []);

  // Auto-slug
  const updateName = (name: string) => {
    setForm((f) => ({ ...f, name, slug: slugify(name) }));
  };

  // Images — pick from disk or URL
  const addImageUrl = () => {
    const input = document.querySelector(
      "input[data-photo-input]",
    ) as HTMLInputElement;
    if (input) input.click();
  };

  const handlePhotoFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (let i = 0; i < files.length && form.images.length + i < 20; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append("file", file);
      try {
        const res = await fetch("/api/upload-file", {
          method: "POST",
          body: formData,
        });
        if (res.ok) {
          const data = await res.json();
          setForm((f) => ({ ...f, images: [...f.images, data.url] }));
        } else {
          // Fallback: use local object URL
          const url = URL.createObjectURL(file);
          setForm((f) => ({ ...f, images: [...f.images, url] }));
        }
      } catch {
        const url = URL.createObjectURL(file);
        setForm((f) => ({ ...f, images: [...f.images, url] }));
      }
    }
    e.target.value = "";
  };

  const removeImage = (idx: number) => {
    setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));
  };

  // Videos — pick from disk or URL
  const addVideoUrl = () => {
    const input = document.querySelector(
      "input[data-video-input]",
    ) as HTMLInputElement;
    if (input) input.click();
  };

  const handleVideoFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (let i = 0; i < files.length && form.videos.length + i < 3; i++) {
      const file = files[i];
      const url = URL.createObjectURL(file);
      setForm((f) => ({ ...f, videos: [...f.videos, url] }));
    }
    e.target.value = "";
  };

  const removeVideo = (idx: number) => {
    setForm((f) => ({ ...f, videos: f.videos.filter((_, i) => i !== idx) }));
  };

  // Parameters — drag from sidebar to card
  const addParam = (paramId: string) => {
    if (form.params.find((p) => p.id === paramId)) return;
    setForm((f) => ({
      ...f,
      params: [...f.params, { id: paramId, value: "" }],
    }));
  };

  const removeParam = (paramId: string) => {
    setForm((f) => ({
      ...f,
      params: f.params.filter((p) => p.id !== paramId),
    }));
  };

  const updateParamValue = (paramId: string, value: string) => {
    setForm((f) => ({
      ...f,
      params: f.params.map((p) => (p.id === paramId ? { ...p, value } : p)),
    }));
  };

  // Drag reorder for images
  const handleImageDragStart = (idx: number) => setDragItem(idx);
  const handleImageDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setDragOverIndex(idx);
  };
  const handleImageDrop = (idx: number) => {
    if (dragItem === null) return;
    const newImages = [...form.images];
    const [moved] = newImages.splice(dragItem, 1);
    newImages.splice(idx, 0, moved);
    setForm((f) => ({ ...f, images: newImages }));
    setDragItem(null);
    setDragOverIndex(null);
  };

  // Drag parameter from sidebar
  const handleParamDragStart = (e: React.DragEvent, paramId: string) => {
    e.dataTransfer.setData("text/plain", paramId);
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleCardDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const paramId = e.dataTransfer.getData("text/plain");
      if (paramId && AVAILABLE_PARAMS.find((p) => p.id === paramId)) {
        addParam(paramId);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [form.params],
  );

  const getParamDef = (id: string) => AVAILABLE_PARAMS.find((p) => p.id === id);

  // Save
  const handleSave = async () => {
    setSaving(true);
    try {
      // Convert to product format
      const product = {
        name: form.name,
        slug: form.slug,
        description: form.description,
        price: parseFloat(form.price) || 0,
        originalPrice: parseFloat(form.originalPrice) || undefined,
        category: form.category,
        images: form.images,
        videos: form.videos,
        inStock: form.inStock,
        stockCount: parseInt(form.stockCount) || 0,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        specifications: form.params.reduce(
          (acc, p) => {
            const def = getParamDef(p.id);
            if (def) acc[def.name] = p.value;
            return acc;
          },
          {} as Record<string, string>,
        ),
      };

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(product),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  // Grouped sidebar params
  const groups = AVAILABLE_PARAMS.reduce(
    (acc, p) => {
      if (!acc[p.group]) acc[p.group] = [];
      acc[p.group].push(p);
      return acc;
    },
    {} as Record<string, ParamDef[]>,
  );

  const formatPrice = (v: string) => {
    const n = parseFloat(v);
    return isNaN(n) ? "0" : n.toLocaleString("ru-RU");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Назад</span>
            </Link>
            <div className="h-6 w-px bg-gray-200" />
            <h1 className="text-lg font-bold text-gray-900">Новый товар</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                previewMode
                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Eye className="w-4 h-4" />
              {previewMode ? "Редактор" : "Предпросмотр"}
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !form.name || !form.price}
              className="flex items-center gap-2 px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium"
            >
              <Save className="w-4 h-4" />
              {saving ? "Сохранение..." : saved ? "Сохранено ✓" : "Сохранить"}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto p-6">
        {/* Hidden file inputs */}
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handlePhotoFiles}
        />
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          multiple
          className="hidden"
          onChange={handleVideoFiles}
        />
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
          {/* === MAIN FORM === */}
          <div className="space-y-6">
            {/* Basic info */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-base font-bold text-gray-900 mb-4">
                Основная информация
              </h2>
              <div className="grid gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Название товара <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => updateName(e.target.value)}
                    placeholder="Стул барный Лофт 75 см"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      URL-slug
                    </label>
                    <input
                      type="text"
                      value={form.slug}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, slug: e.target.value }))
                      }
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-500 bg-gray-50 font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Категория <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={form.category}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, category: e.target.value }))
                      }
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 bg-white"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c.replace(/-/g, " ")}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Описание
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, description: e.target.value }))
                    }
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder:text-gray-400 resize-none"
                    placeholder="Подробное описание товара..."
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Цена <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={form.price}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, price: e.target.value }))
                        }
                        placeholder="14990"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 pr-10"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                        ₽
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Старая цена
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={form.originalPrice}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            originalPrice: e.target.value,
                          }))
                        }
                        placeholder="19990"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 pr-10"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                        ₽
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Кол-во на складе
                    </label>
                    <input
                      type="number"
                      value={form.stockCount}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, stockCount: e.target.value }))
                      }
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.inStock}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, inStock: e.target.checked }))
                      }
                      className="w-5 h-5 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                    />
                    <span className="text-sm text-gray-700">В наличии</span>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Теги{" "}
                    <span className="text-xs text-gray-400">
                      (через запятую)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={form.tags}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, tags: e.target.value }))
                    }
                    placeholder="новинка, бестселлер, лофт"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder:text-gray-400"
                  />
                </div>
              </div>
            </div>

            {/* Images — up to 20 */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-gray-900">
                  Фотографии{" "}
                  <span className="text-gray-400 font-normal text-sm">
                    ({form.images.length}/20)
                  </span>
                </h2>
                <button
                  onClick={addImageUrl}
                  disabled={form.images.length >= 20}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-40"
                >
                  <ImagePlus className="w-4 h-4" />
                  Добавить фото
                </button>
              </div>
              {form.images.length === 0 ? (
                <div
                  onClick={addImageUrl}
                  className="border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-all group"
                >
                  <Upload className="w-12 h-12 text-gray-300 mx-auto mb-3 group-hover:text-gray-400 transition-colors" />
                  <p className="text-gray-500 font-medium">
                    Добавьте фотографии товара
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    До 20 изображений. Перетаскивайте для сортировки
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3">
                  {form.images.map((img, idx) => (
                    <div
                      key={idx}
                      draggable
                      onDragStart={() => handleImageDragStart(idx)}
                      onDragOver={(e) => handleImageDragOver(e, idx)}
                      onDrop={() => handleImageDrop(idx)}
                      onDragEnd={() => {
                        setDragItem(null);
                        setDragOverIndex(null);
                      }}
                      className={`relative aspect-square rounded-xl overflow-hidden border-2 cursor-grab active:cursor-grabbing group transition-all ${
                        dragOverIndex === idx
                          ? "border-blue-500 scale-105"
                          : idx === 0
                            ? "border-[var(--color-accent)]"
                            : "border-gray-200"
                      }`}
                    >
                      <Image
                        src={img}
                        alt={`Фото ${idx + 1}`}
                        fill
                        className="object-cover"
                        sizes="100px"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            `https://picsum.photos/seed/${idx}/200/200`;
                        }}
                      />
                      {idx === 0 && (
                        <div className="absolute top-1 left-1 bg-[var(--color-accent)] text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                          Главное
                        </div>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage(idx);
                        }}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500/90 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <div className="absolute bottom-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <GripVertical className="w-4 h-4 text-white drop-shadow" />
                      </div>
                    </div>
                  ))}
                  {form.images.length < 20 && (
                    <div
                      onClick={addImageUrl}
                      className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-all"
                    >
                      <Plus className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Videos — up to 3 */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-gray-900">
                  Видео{" "}
                  <span className="text-gray-400 font-normal text-sm">
                    ({form.videos.length}/3)
                  </span>
                </h2>
                <button
                  onClick={addVideoUrl}
                  disabled={form.videos.length >= 3}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-40"
                >
                  <Video className="w-4 h-4" />
                  Добавить видео
                </button>
              </div>
              {form.videos.length === 0 ? (
                <div
                  onClick={addVideoUrl}
                  className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-all"
                >
                  <Video className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">
                    Добавьте видео с YouTube или Vimeo
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {form.videos.map((v, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
                    >
                      <Video className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-gray-700 truncate flex-1">
                        {v}
                      </span>
                      <button
                        onClick={() => removeVideo(idx)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Visual Card Editor — drop zone for params */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-base font-bold text-gray-900 mb-4">
                Визуальный редактор карточки
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                Перетащите параметры из правой панели сюда или нажмите{" "}
                <span className="font-medium text-gray-700">+</span> на
                параметре
              </p>

              {/* Card preview + drop zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.add("ring-2", "ring-blue-400");
                }}
                onDragLeave={(e) =>
                  e.currentTarget.classList.remove("ring-2", "ring-blue-400")
                }
                onDrop={(e) => {
                  e.currentTarget.classList.remove("ring-2", "ring-blue-400");
                  handleCardDrop(e);
                }}
                className="border-2 border-dashed border-gray-200 rounded-2xl p-6 transition-all min-h-[200px]"
              >
                {form.params.length === 0 ? (
                  <div className="text-center py-10 text-gray-400">
                    <Layers className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium text-gray-500">
                      Перетащите параметры сюда
                    </p>
                    <p className="text-sm mt-1">
                      или выберите из панели справа
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {form.params.map((param) => {
                      const def = getParamDef(param.id);
                      if (!def) return null;
                      return (
                        <div
                          key={param.id}
                          className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 group hover:bg-gray-100 transition-colors"
                        >
                          <GripVertical className="w-4 h-4 text-gray-300 cursor-grab flex-shrink-0" />
                          <def.icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="text-sm font-medium text-gray-700 min-w-[140px]">
                            {def.name}
                          </span>
                          <div className="flex-1">
                            {def.type === "boolean" ? (
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={param.value === "true"}
                                  onChange={(e) =>
                                    updateParamValue(
                                      param.id,
                                      e.target.checked ? "true" : "false",
                                    )
                                  }
                                  className="w-5 h-5 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                                />
                                <span className="text-sm text-gray-500">
                                  {param.value === "true" ? "Да" : "Нет"}
                                </span>
                              </label>
                            ) : def.type === "select" ? (
                              <select
                                value={param.value}
                                onChange={(e) =>
                                  updateParamValue(param.id, e.target.value)
                                }
                                className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-900 bg-white"
                              >
                                <option value="">Выберите...</option>
                                {def.options?.map((o) => (
                                  <option key={o} value={o}>
                                    {o}
                                  </option>
                                ))}
                              </select>
                            ) : def.type === "color" ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="color"
                                  value={param.value || "#000000"}
                                  onChange={(e) =>
                                    updateParamValue(param.id, e.target.value)
                                  }
                                  className="w-8 h-8 rounded cursor-pointer border-0"
                                />
                                <input
                                  type="text"
                                  value={param.value}
                                  onChange={(e) =>
                                    updateParamValue(param.id, e.target.value)
                                  }
                                  className="w-24 px-2 py-1 rounded-lg border border-gray-200 text-sm font-mono"
                                />
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <input
                                  type={
                                    def.type === "number" ? "number" : "text"
                                  }
                                  value={param.value}
                                  onChange={(e) =>
                                    updateParamValue(param.id, e.target.value)
                                  }
                                  placeholder={def.placeholder}
                                  className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-900"
                                />
                                {def.unit && (
                                  <span className="text-sm text-gray-400 flex-shrink-0">
                                    {def.unit}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => removeParam(param.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Live Preview (card view) */}
            {previewMode && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h2 className="text-base font-bold text-gray-900 mb-4">
                  Предпросмотр карточки
                </h2>
                <div className="max-w-sm mx-auto">
                  <div className="product-card overflow-hidden">
                    <div className="aspect-[4/5] bg-gray-100 relative">
                      {form.images[0] ? (
                        <Image
                          src={form.images[0]}
                          alt={form.name}
                          fill
                          className="object-cover"
                          sizes="400px"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "https://picsum.photos/400/500";
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <ImagePlus className="w-16 h-16" />
                        </div>
                      )}
                      {form.originalPrice &&
                        parseFloat(form.originalPrice) >
                          parseFloat(form.price) && (
                          <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-lg">
                            -
                            {Math.round(
                              100 -
                                (parseFloat(form.price) /
                                  parseFloat(form.originalPrice)) *
                                  100,
                            )}
                            %
                          </span>
                        )}
                    </div>
                    <div className="p-4">
                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                        {form.category.replace(/-/g, " ")}
                      </p>
                      <h3 className="font-semibold text-gray-900 mb-2 text-sm line-clamp-2">
                        {form.name || "Название товара"}
                      </h3>
                      <div className="flex items-end gap-2">
                        <span className="text-lg font-bold text-gray-900">
                          {formatPrice(form.price)} ₽
                        </span>
                        {form.originalPrice && (
                          <span className="text-sm text-gray-400 line-through">
                            {formatPrice(form.originalPrice)} ₽
                          </span>
                        )}
                      </div>
                      {form.params.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-100 space-y-1.5">
                          {form.params
                            .filter((p) => p.value)
                            .slice(0, 5)
                            .map((p) => {
                              const def = getParamDef(p.id);
                              return def ? (
                                <div
                                  key={p.id}
                                  className="flex justify-between text-xs"
                                >
                                  <span className="text-gray-400">
                                    {def.name}
                                  </span>
                                  <span className="text-gray-700 font-medium">
                                    {def.type === "boolean"
                                      ? p.value === "true"
                                        ? "Да"
                                        : "Нет"
                                      : `${p.value}${def.unit ? ` ${def.unit}` : ""}`}
                                  </span>
                                </div>
                              ) : null;
                            })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* === SIDEBAR — Parameters === */}
          <div className="hidden xl:block">
            <div className="sticky top-[65px] space-y-2 max-h-[calc(100vh-90px)] overflow-y-auto pr-1">
              <div className="bg-white rounded-2xl border border-gray-200 p-4">
                <h3 className="text-sm font-bold text-gray-900 mb-3">
                  Параметры товара
                </h3>
                <p className="text-xs text-gray-400 mb-4">
                  Перетащите на карточку или нажмите{" "}
                  <Plus className="w-3 h-3 inline" />
                </p>

                {Object.entries(groups).map(([groupName, params]) => (
                  <div key={groupName} className="mb-2">
                    <button
                      onClick={() =>
                        setExpandedGroups((g) => ({
                          ...g,
                          [groupName]: !g[groupName],
                        }))
                      }
                      className="flex items-center justify-between w-full text-left px-2 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      {groupName}
                      {expandedGroups[groupName] ? (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5" />
                      )}
                    </button>
                    {expandedGroups[groupName] && (
                      <div className="space-y-1 mt-1">
                        {params.map((p) => {
                          const isAdded = form.params.some(
                            (fp) => fp.id === p.id,
                          );
                          return (
                            <div
                              key={p.id}
                              draggable={!isAdded}
                              onDragStart={(e) => handleParamDragStart(e, p.id)}
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                                isAdded
                                  ? "bg-green-50 text-green-700 cursor-default"
                                  : "bg-gray-50 text-gray-700 hover:bg-gray-100 cursor-grab active:cursor-grabbing"
                              }`}
                            >
                              <p.icon className="w-3.5 h-3.5 flex-shrink-0" />
                              <span className="flex-1 truncate text-xs font-medium">
                                {p.name}
                              </span>
                              {!isAdded ? (
                                <button
                                  onClick={() => addParam(p.id)}
                                  className="p-0.5 hover:bg-gray-200 rounded transition-colors"
                                >
                                  <Plus className="w-3.5 h-3.5 text-gray-500" />
                                </button>
                              ) : (
                                <span className="text-[10px] text-green-500">
                                  ✓
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
