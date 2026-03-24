"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  Search,
  ChevronDown,
} from "lucide-react";

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  total: number;
}

interface Order {
  id: string;
  number: string;
  customer: { name: string; phone: string; email: string };
  delivery: { method: string; city: string; address: string };
  payment: { method: string; status: string };
  items: OrderItem[];
  subtotal: number;
  deliveryPrice: number;
  total: number;
  status: string;
  comment: string;
  createdAt: string;
}

const statusLabels: Record<
  string,
  { label: string; color: string; icon: any }
> = {
  new: { label: "Новый", color: "bg-blue-100 text-blue-700", icon: Clock },
  confirmed: {
    label: "Подтверждён",
    color: "bg-yellow-100 text-yellow-700",
    icon: CheckCircle,
  },
  paid: {
    label: "Оплачен",
    color: "bg-green-100 text-green-700",
    icon: CheckCircle,
  },
  processing: {
    label: "В обработке",
    color: "bg-purple-100 text-purple-700",
    icon: Package,
  },
  shipped: {
    label: "Отправлен",
    color: "bg-indigo-100 text-indigo-700",
    icon: Truck,
  },
  delivered: {
    label: "Доставлен",
    color: "bg-green-100 text-green-700",
    icon: CheckCircle,
  },
  completed: {
    label: "Завершён",
    color: "bg-gray-100 text-gray-700",
    icon: CheckCircle,
  },
  cancelled: {
    label: "Отменён",
    color: "bg-red-100 text-red-700",
    icon: XCircle,
  },
};

const deliveryLabels: Record<string, string> = {
  courier: "Курьер",
  pickup: "Самовывоз",
  cdek: "СДЭК",
  pek: "ПЭК",
};

const paymentLabels: Record<string, string> = {
  cash: "При получении",
  card: "Картой онлайн",
  installment: "Рассрочка",
};

const formatPrice = (n: number) => new Intl.NumberFormat("ru-RU").format(n);
const formatDate = (s: string) => {
  const d = new Date(s);
  return d.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filter) params.set("status", filter);
    params.set("limit", "100");

    fetch(`/api/orders?${params}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setOrders(d.data);
      })
      .finally(() => setLoading(false));
  }, [filter]);

  const filteredOrders = search
    ? orders.filter(
        (o) =>
          o.number.toLowerCase().includes(search.toLowerCase()) ||
          o.customer.name.toLowerCase().includes(search.toLowerCase()) ||
          o.customer.phone.includes(search),
      )
    : orders;

  const updateStatus = async (orderId: string, newStatus: string) => {
    const res = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    const data = await res.json();
    if (data.success) {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)),
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Заказы</h1>
              <p className="text-sm text-gray-500">
                Всего: {orders.length} заказов
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск по номеру, имени, телефону..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilter("")}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                !filter
                  ? "bg-gray-900 text-white"
                  : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              Все
            </button>
            {[
              "new",
              "confirmed",
              "paid",
              "processing",
              "shipped",
              "delivered",
              "completed",
              "cancelled",
            ].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === s
                    ? "bg-gray-900 text-white"
                    : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {statusLabels[s]?.label || s}
              </button>
            ))}
          </div>
        </div>

        {/* Orders list */}
        {loading ? (
          <div className="text-center py-20 text-gray-400">Загрузка...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            Заказов не найдено
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const isExpanded = expanded === order.id;
              const statusInfo = statusLabels[order.status] || statusLabels.new;
              const StatusIcon = statusInfo.icon;
              return (
                <div
                  key={order.id}
                  className="bg-white border border-gray-200 rounded-xl overflow-hidden"
                >
                  {/* Header row */}
                  <button
                    onClick={() => setExpanded(isExpanded ? null : order.id)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}
                      >
                        <StatusIcon className="w-3.5 h-3.5" />
                        {statusInfo.label}
                      </span>
                      <span className="font-bold text-gray-900">
                        {order.number}
                      </span>
                      <span className="text-sm text-gray-500">
                        {order.customer.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-gray-900">
                        {formatPrice(order.total)} ₽
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatDate(order.createdAt)}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-gray-400 transition-transform ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                  </button>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="px-6 pb-6 border-t border-gray-100 pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-2">
                            Покупатель
                          </h4>
                          <p className="text-gray-900 font-medium">
                            {order.customer.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {order.customer.phone}
                          </p>
                          {order.customer.email && (
                            <p className="text-sm text-gray-600">
                              {order.customer.email}
                            </p>
                          )}
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-2">
                            Доставка
                          </h4>
                          <p className="text-gray-900 font-medium">
                            {deliveryLabels[order.delivery.method] ||
                              order.delivery.method}
                          </p>
                          {order.delivery.address && (
                            <p className="text-sm text-gray-600">
                              {order.delivery.city}, {order.delivery.address}
                            </p>
                          )}
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-2">
                            Оплата
                          </h4>
                          <p className="text-gray-900 font-medium">
                            {paymentLabels[order.payment.method] ||
                              order.payment.method}
                          </p>
                        </div>
                      </div>

                      {order.comment && (
                        <div className="mb-4 bg-yellow-50 p-3 rounded-lg text-sm text-yellow-800">
                          <strong>Комментарий:</strong> {order.comment}
                        </div>
                      )}

                      {/* Items */}
                      <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="text-left px-4 py-2 text-gray-500 font-medium">
                                Товар
                              </th>
                              <th className="text-right px-4 py-2 text-gray-500 font-medium">
                                Цена
                              </th>
                              <th className="text-right px-4 py-2 text-gray-500 font-medium">
                                Кол-во
                              </th>
                              <th className="text-right px-4 py-2 text-gray-500 font-medium">
                                Сумма
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {order.items.map((item, idx) => (
                              <tr
                                key={idx}
                                className="border-t border-gray-100"
                              >
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-3">
                                    {item.image && (
                                      <img
                                        src={item.image}
                                        alt=""
                                        className="w-10 h-10 object-cover rounded"
                                      />
                                    )}
                                    <span className="line-clamp-1">
                                      {item.name}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  {formatPrice(item.price)} ₽
                                </td>
                                <td className="px-4 py-3 text-right">
                                  {item.quantity}
                                </td>
                                <td className="px-4 py-3 text-right font-medium">
                                  {formatPrice(item.total)} ₽
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-500">
                          Сменить статус:
                        </span>
                        {[
                          "confirmed",
                          "paid",
                          "processing",
                          "shipped",
                          "delivered",
                          "completed",
                          "cancelled",
                        ]
                          .filter((s) => s !== order.status)
                          .slice(0, 4)
                          .map((s) => (
                            <button
                              key={s}
                              onClick={() => updateStatus(order.id, s)}
                              className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              {statusLabels[s]?.label || s}
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
