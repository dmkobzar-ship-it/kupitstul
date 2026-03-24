"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Trash2,
  Pencil,
  ChevronDown,
  ChevronRight,
  Search,
  Package,
  ArrowLeft,
  Save,
  X,
  ImagePlus,
  AlertTriangle,
} from "lucide-react";
import Image from "next/image";

interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  oldPrice?: number;
  category: string;
  images: string[];
  image?: string;
  inStock: boolean;
  specifications?: Record<string, any>;
  colors?: { name: string; hex: string }[];
  materials?: string[];
  rating?: string | number;
  reviewsCount?: number;
  badges?: string[];
}

interface CategoryGroup {
  slug: string;
  name: string;
  products: Product[];
  expanded: boolean;
}

const CATEGORY_NAMES: Record<string, string> = {
  stulya: "Стулья",
  kresla: "Кресла",
  stoly: "Столы",
  divany: "Диваны",
  banketki: "Банкетки",
  taburety: "Табуреты",
  kushetki: "Кушетки",
  pufy: "Пуфы",
  shkafi: "Шкафы",
  stellazhi: "Стеллажи",
  komody: "Комоды",
  prikrovatnye: "Прикроватные",
};

const formatPrice = (n: number) =>
  new Intl.NumberFormat("ru-RU").format(n) + " ₽";

export default function ProductManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  // Load all products
  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    setLoading(true);
    try {
      const res = await fetch("/api/upload?limit=10000");
      const data = await res.json();
      if (data.success) {
        setProducts(data.data);
      }
    } catch (e) {
      console.error("Load products error:", e);
    } finally {
      setLoading(false);
    }
  }

  // Group products by category
  const categoryGroups = useMemo(() => {
    const q = search.toLowerCase().trim();
    const filtered = q
      ? products.filter(
          (p) =>
            p.name?.toLowerCase().includes(q) ||
            p.id?.toLowerCase().includes(q) ||
            p.slug?.toLowerCase().includes(q),
        )
      : products;

    const groups: Record<string, Product[]> = {};
    for (const p of filtered) {
      const cat = p.category || "other";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(p);
    }

    return Object.entries(groups)
      .map(([slug, prods]) => ({
        slug,
        name: CATEGORY_NAMES[slug] || slug,
        products: prods.sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products, search]);

  function showToast(msg: string, type: "success" | "error" = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  function toggleCategory(slug: string) {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }

  function expandAll() {
    setExpandedCats(new Set(categoryGroups.map((g) => g.slug)));
  }

  function collapseAll() {
    setExpandedCats(new Set());
  }

  // Delete product
  async function handleDelete(productId: string) {
    setDeleting(productId);
    try {
      const res = await fetch(
        `/api/upload?id=${encodeURIComponent(productId)}`,
        {
          method: "DELETE",
        },
      );
      const data = await res.json();
      if (data.success) {
        setProducts((prev) => prev.filter((p) => p.id !== productId));
        showToast("Товар удалён");
      } else {
        showToast(data.error || "Ошибка удаления", "error");
      }
    } catch (e) {
      showToast("Ошибка удаления", "error");
    } finally {
      setDeleting(null);
      setDeleteConfirm(null);
    }
  }

  // Save edited product
  async function handleSave(product: Product) {
    setSaving(true);
    try {
      const res = await fetch("/api/upload", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(product),
      });
      const data = await res.json();
      if (data.success) {
        setProducts((prev) =>
          prev.map((p) => (p.id === product.id ? { ...p, ...product } : p)),
        );
        setEditProduct(null);
        showToast("Товар сохранён");
      } else {
        showToast(data.error || "Ошибка сохранения", "error");
      }
    } catch (e) {
      showToast("Ошибка сохранения", "error");
    } finally {
      setSaving(false);
    }
  }

  // ─── Edit Form View ─────────────────────────────────
  if (editProduct) {
    return (
      <ProductEditForm
        product={editProduct}
        onSave={handleSave}
        onCancel={() => setEditProduct(null)}
        saving={saving}
      />
    );
  }

  // ─── Product List View ──────────────────────────────
  return (
    <div>
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium animate-pulse ${
            toast.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="w-5 h-5" />
            Товары ({products.length})
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {categoryGroups.length} категорий
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={expandAll}
            className="text-xs text-blue-600 hover:underline"
          >
            Развернуть все
          </button>
          <span className="text-gray-300">|</span>
          <button
            onClick={collapseAll}
            className="text-xs text-blue-600 hover:underline"
          >
            Свернуть
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск товара по названию или ID..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Загрузка...</div>
      ) : categoryGroups.length === 0 ? (
        <div className="text-center py-12 text-gray-500">Товары не найдены</div>
      ) : (
        <div className="space-y-3">
          {categoryGroups.map((group) => {
            const isExpanded = expandedCats.has(group.slug);
            return (
              <div
                key={group.slug}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden"
              >
                {/* Category header */}
                <button
                  onClick={() => toggleCategory(group.slug)}
                  className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                    <span className="font-semibold text-gray-900">
                      {group.name}
                    </span>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                      {group.products.length}
                    </span>
                  </div>
                </button>

                {/* Products in category */}
                {isExpanded && (
                  <div className="border-t border-gray-100">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 text-left text-gray-500 text-xs uppercase">
                          <th className="px-5 py-2 w-16">Фото</th>
                          <th className="px-3 py-2">Название</th>
                          <th className="px-3 py-2 w-28 text-right">Цена</th>
                          <th className="px-3 py-2 w-20 text-center">
                            Наличие
                          </th>
                          <th className="px-5 py-2 w-32 text-right">
                            Действия
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.products.map((product) => {
                          const img =
                            product.images?.[0] || product.image || "";
                          return (
                            <tr
                              key={product.id}
                              className="border-t border-gray-50 hover:bg-blue-50/30 transition-colors"
                            >
                              <td className="px-5 py-2">
                                {img ? (
                                  <div className="w-10 h-10 relative rounded-lg overflow-hidden bg-gray-100">
                                    <img
                                      src={img}
                                      alt=""
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        (
                                          e.target as HTMLImageElement
                                        ).style.display = "none";
                                      }}
                                    />
                                  </div>
                                ) : (
                                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                    <ImagePlus className="w-4 h-4 text-gray-300" />
                                  </div>
                                )}
                              </td>
                              <td className="px-3 py-2">
                                <p className="text-gray-900 font-medium truncate max-w-[350px]">
                                  {product.name}
                                </p>
                                <p className="text-[11px] text-gray-400 mt-0.5">
                                  {product.id}
                                </p>
                              </td>
                              <td className="px-3 py-2 text-right">
                                <span className="font-semibold text-gray-900">
                                  {formatPrice(product.price)}
                                </span>
                                {product.oldPrice &&
                                  product.oldPrice > product.price && (
                                    <p className="text-[11px] text-gray-400 line-through">
                                      {formatPrice(product.oldPrice)}
                                    </p>
                                  )}
                              </td>
                              <td className="px-3 py-2 text-center">
                                <span
                                  className={`text-xs px-2 py-0.5 rounded-full ${
                                    product.inStock
                                      ? "bg-green-50 text-green-700"
                                      : "bg-red-50 text-red-600"
                                  }`}
                                >
                                  {product.inStock ? "Да" : "Нет"}
                                </span>
                              </td>
                              <td className="px-5 py-2 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    onClick={() => setEditProduct(product)}
                                    className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                                    title="Редактировать"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                  {deleteConfirm === product.id ? (
                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={() => handleDelete(product.id)}
                                        disabled={deleting === product.id}
                                        className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                                      >
                                        {deleting === product.id ? "..." : "Да"}
                                      </button>
                                      <button
                                        onClick={() => setDeleteConfirm(null)}
                                        className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                                      >
                                        Нет
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() =>
                                        setDeleteConfirm(product.id)
                                      }
                                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                                      title="Удалить"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// Product Edit Form
// ═══════════════════════════════════════════════════════

function ProductEditForm({
  product,
  onSave,
  onCancel,
  saving,
}: {
  product: Product;
  onSave: (p: Product) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<Product>({ ...product });
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newColorName, setNewColorName] = useState("");
  const [newColorHex, setNewColorHex] = useState("#000000");

  function updateField<K extends keyof Product>(key: K, value: Product[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function addImage() {
    const url = newImageUrl.trim();
    if (!url) return;
    updateField("images", [...(form.images || []), url]);
    setNewImageUrl("");
  }

  function removeImage(idx: number) {
    updateField(
      "images",
      (form.images || []).filter((_, i) => i !== idx),
    );
  }

  function addColor() {
    if (!newColorName.trim()) return;
    updateField("colors", [
      ...(form.colors || []),
      { name: newColorName.trim(), hex: newColorHex },
    ]);
    setNewColorName("");
    setNewColorHex("#000000");
  }

  function removeColor(idx: number) {
    updateField(
      "colors",
      (form.colors || []).filter((_, i) => i !== idx),
    );
  }

  function updateSpec(key: string, value: string) {
    updateField("specifications", {
      ...(form.specifications || {}),
      [key]: value,
    });
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Редактирование товара
            </h2>
            <p className="text-sm text-gray-500">ID: {product.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            Отмена
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={saving || !form.name}
            className="flex items-center gap-2 px-5 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-40 text-sm font-medium"
          >
            <Save className="w-4 h-4" />
            {saving ? "Сохранение..." : "Сохранить"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic fields */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h3 className="font-semibold text-gray-900">Основное</h3>

            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Название *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Slug</label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => updateField("slug", e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Описание
              </label>
              <textarea
                value={form.description || ""}
                onChange={(e) => updateField("description", e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Цена *
                </label>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) =>
                    updateField("price", parseFloat(e.target.value) || 0)
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Старая цена
                </label>
                <input
                  type="number"
                  value={form.oldPrice || ""}
                  onChange={(e) =>
                    updateField(
                      "oldPrice",
                      parseFloat(e.target.value) || undefined,
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Категория
                </label>
                <select
                  value={form.category}
                  onChange={(e) => updateField("category", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(CATEGORY_NAMES).map(([slug, name]) => (
                    <option key={slug} value={slug}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.inStock}
                    onChange={(e) => updateField("inStock", e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">В наличии</span>
                </label>
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h3 className="font-semibold text-gray-900">
              Изображения ({(form.images || []).length})
            </h3>

            <div className="grid grid-cols-4 gap-3">
              {(form.images || []).map((img, idx) => (
                <div
                  key={idx}
                  className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100"
                >
                  <img
                    src={img}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg'/>";
                    }}
                  />
                  <button
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="url"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="URL изображения"
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                onKeyDown={(e) => e.key === "Enter" && addImage()}
              />
              <button
                onClick={addImage}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
              >
                Добавить
              </button>
            </div>
          </div>

          {/* Specifications */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h3 className="font-semibold text-gray-900">Характеристики</h3>

            {form.specifications &&
              Object.entries(form.specifications).map(([key, val]) => (
                <div key={key} className="flex items-center gap-3">
                  <input
                    type="text"
                    value={key}
                    readOnly
                    className="w-1/3 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50"
                  />
                  <input
                    type="text"
                    value={String(val || "")}
                    onChange={(e) => updateSpec(key, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                  <button
                    onClick={() => {
                      const specs = { ...(form.specifications || {}) };
                      delete specs[key];
                      updateField("specifications", specs);
                    }}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Preview */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Предпросмотр</h3>
            {(form.images?.[0] || form.image) && (
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 mb-3">
                <img
                  src={form.images?.[0] || form.image || ""}
                  alt={form.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <h4 className="font-medium text-gray-900 text-sm">{form.name}</h4>
            <p className="text-lg font-bold text-gray-900 mt-1">
              {formatPrice(form.price)}
            </p>
            {form.oldPrice && form.oldPrice > form.price && (
              <p className="text-sm text-gray-400 line-through">
                {formatPrice(form.oldPrice)}
              </p>
            )}
          </div>

          {/* Colors */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
            <h3 className="font-semibold text-gray-900">Цвета</h3>
            <div className="space-y-2">
              {(form.colors || []).map((c, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full border border-gray-200"
                    style={{ backgroundColor: c.hex }}
                  />
                  <span className="text-sm text-gray-700 flex-1">{c.name}</span>
                  <button
                    onClick={() => removeColor(idx)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={newColorHex}
                onChange={(e) => setNewColorHex(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer"
              />
              <input
                type="text"
                value={newColorName}
                onChange={(e) => setNewColorName(e.target.value)}
                placeholder="Название цвета"
                className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg text-sm"
                onKeyDown={(e) => e.key === "Enter" && addColor()}
              />
              <button
                onClick={addColor}
                className="px-3 py-1.5 bg-gray-900 text-white rounded-lg text-xs"
              >
                +
              </button>
            </div>
          </div>

          {/* Materials */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
            <h3 className="font-semibold text-gray-900">Материалы</h3>
            <div className="flex flex-wrap gap-2">
              {(form.materials || []).map((m, idx) => (
                <span
                  key={idx}
                  className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs text-gray-700"
                >
                  {m}
                  <button
                    onClick={() =>
                      updateField(
                        "materials",
                        (form.materials || []).filter((_, i) => i !== idx),
                      )
                    }
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Rating */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
            <h3 className="font-semibold text-gray-900">Рейтинг</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500">Оценка</label>
                <input
                  type="text"
                  value={String(form.rating || "")}
                  onChange={(e) => updateField("rating", e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Отзывы</label>
                <input
                  type="number"
                  value={form.reviewsCount || 0}
                  onChange={(e) =>
                    updateField("reviewsCount", parseInt(e.target.value) || 0)
                  }
                  className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
