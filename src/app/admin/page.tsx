"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Package,
  ShoppingCart,
  TrendingUp,
  Users,
  BarChart3,
  FileDown,
  Settings,
} from "lucide-react";
import ImportProducts from "@/components/admin/ImportProducts";
import ProductUpload from "@/components/admin/ProductUpload";
import CategoryImageManager from "@/components/admin/CategoryImageManager";
import HomepageManager from "@/components/admin/HomepageManager";
import BlogManager from "@/components/admin/BlogManager";
import AboutPhotoManager from "@/components/admin/AboutPhotoManager";
import ProductManager from "@/components/admin/ProductManager";

interface Stats {
  products: { total: number; inStock: number; outOfStock: number };
  orders: {
    total: number;
    today: number;
    thisMonth: number;
    statuses: Record<string, number>;
  };
  revenue: { total: number; average: number };
  categories: number;
  topProducts: {
    productId: string;
    name: string;
    count: number;
    revenue: number;
  }[];
}

const formatPrice = (n: number) => new Intl.NumberFormat("ru-RU").format(n);

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [tab, setTab] = useState<
    "dashboard" | "products" | "import" | "categories" | "homepage" | "blog"
  >("dashboard");

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setStats(d.data);
      })
      .catch(() => {});
  }, []);

  // Fallback to imported data counts
  const totalProducts = stats?.products.total || 0;
  const inStock = stats?.products.inStock || 0;
  const catCount = stats?.categories || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Панель администратора
            </h1>
            <p className="text-sm text-gray-500">КупитьСтул CRM</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/orders"
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
            >
              <ShoppingCart className="w-4 h-4" />
              Заказы
              {stats?.orders.total ? (
                <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {stats.orders.total}
                </span>
              ) : null}
            </Link>
            <Link
              href="/admin/products/new"
              className="flex items-center gap-2 px-5 py-2.5 bg-[var(--color-accent)] text-white rounded-lg hover:bg-[var(--color-accent-hover)] transition-colors text-sm font-bold shadow-md hover:shadow-lg"
            >
              <Package className="w-5 h-5" />
              Добавить товар
            </Link>
            <Link
              href="/"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              На сайт →
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          {[
            { id: "dashboard" as const, label: "Дашборд", icon: BarChart3 },
            { id: "products" as const, label: "Товары", icon: Package },
            { id: "homepage" as const, label: "Главная", icon: Settings },
            { id: "blog" as const, label: "Блог", icon: FileDown },
            { id: "import" as const, label: "Импорт", icon: FileDown },
            { id: "categories" as const, label: "Категории", icon: Settings },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t.id
                  ? "bg-gray-900 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        {tab === "dashboard" && (
          <>
            {/* Stats cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-white p-5 rounded-xl border border-gray-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-sm text-gray-500">Товары</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatPrice(totalProducts)}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  В наличии: {formatPrice(inStock)}
                </p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-gray-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="text-sm text-gray-500">Заказы</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.orders.total || 0}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Сегодня: {stats?.orders.today || 0}
                </p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-gray-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className="text-sm text-gray-500">Выручка</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatPrice(stats?.revenue.total || 0)} ₽
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Средний чек: {formatPrice(stats?.revenue.average || 0)} ₽
                </p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-gray-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                    <Settings className="w-5 h-5 text-orange-600" />
                  </div>
                  <span className="text-sm text-gray-500">Категории</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{catCount}</p>
              </div>
            </div>

            {/* Top products */}
            {stats?.topProducts && stats.topProducts.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Топ товары
                </h3>
                <div className="space-y-3">
                  {stats.topProducts.map((p, i) => (
                    <div
                      key={p.productId}
                      className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-gray-400 text-sm">{i + 1}.</span>
                        <span className="text-gray-900 font-medium">
                          {p.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-gray-500">{p.count} шт.</span>
                        <span className="font-medium text-gray-900">
                          {formatPrice(p.revenue)} ₽
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Order statuses */}
            {stats?.orders.statuses &&
              Object.keys(stats.orders.statuses).length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    Статусы заказов
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(stats.orders.statuses).map(
                      ([status, count]) => {
                        const labels: Record<string, string> = {
                          new: "Новые",
                          confirmed: "Подтверждённые",
                          paid: "Оплаченные",
                          processing: "В обработке",
                          shipped: "Отправленные",
                          delivered: "Доставленные",
                          completed: "Завершённые",
                          cancelled: "Отменённые",
                        };
                        return (
                          <div
                            key={status}
                            className="text-center p-3 bg-gray-50 rounded-lg"
                          >
                            <p className="text-2xl font-bold text-gray-900">
                              {count}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {labels[status] || status}
                            </p>
                          </div>
                        );
                      },
                    )}
                  </div>
                </div>
              )}
          </>
        )}

        {tab === "products" && (
          <div className="max-w-6xl">
            <ProductManager />
          </div>
        )}

        {tab === "import" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ImportProducts />
            <ProductUpload />
          </div>
        )}

        {tab === "categories" && (
          <div className="max-w-4xl">
            <CategoryImageManager />
          </div>
        )}

        {tab === "homepage" && (
          <div className="max-w-5xl space-y-6">
            <HomepageManager />
            <AboutPhotoManager />
          </div>
        )}

        {tab === "blog" && (
          <div className="max-w-5xl">
            <BlogManager />
          </div>
        )}
      </div>
    </div>
  );
}
