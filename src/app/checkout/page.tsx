"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle,
  Truck,
  CreditCard,
  MapPin,
} from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";

type DeliveryMethod = "courier" | "pickup" | "cdek" | "pek";
type PaymentMethod = "cash" | "card" | "installment";

export default function CheckoutPage() {
  const { items, getTotalPrice, getTotalItems, clearCart } = useCart();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("Москва");
  const [address, setAddress] = useState("");
  const [comment, setComment] = useState("");
  const [delivery, setDelivery] = useState<DeliveryMethod>("courier");
  const [payment, setPayment] = useState<PaymentMethod>("cash");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const formatPrice = (n: number) => new Intl.NumberFormat("ru-RU").format(n);

  const deliveryPrice =
    delivery === "pickup" ? 0 : getTotalPrice() >= 100000 ? 0 : 900;

  if (orderNumber) {
    return (
      <div className="container py-20 text-center">
        <CheckCircle className="w-20 h-20 mx-auto text-green-500 mb-6" />
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Заказ оформлен!
        </h1>
        <p className="text-gray-600 mb-2">
          Номер вашего заказа:{" "}
          <span className="font-bold text-gray-900">{orderNumber}</span>
        </p>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">
          Мы свяжемся с вами в ближайшее время для подтверждения заказа.
        </p>
        <Link
          href="/catalog"
          className="inline-flex items-center gap-2 bg-gray-900 text-white px-8 py-3 rounded-lg hover:bg-gray-800 transition-colors font-medium"
        >
          Продолжить покупки
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container py-20 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Корзина пуста</h1>
        <Link
          href="/catalog"
          className="inline-flex items-center gap-2 bg-gray-900 text-white px-8 py-3 rounded-lg hover:bg-gray-800 transition-colors font-medium mt-6"
        >
          <ArrowLeft className="w-5 h-5" />В каталог
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: { name, phone, email },
          delivery: { method: delivery, city, address },
          payment: { method: payment },
          comment,
          items: items.map((i) => ({
            productId: i.productId,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
            image: i.image,
            slug: i.slug,
          })),
          subtotal: getTotalPrice(),
          deliveryPrice,
          total: getTotalPrice() + deliveryPrice,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Ошибка оформления заказа");
      }

      setOrderNumber(data.data.number);
      clearCart();
      // Email уведомление отправляется server-side в /api/orders
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Произошла ошибка");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container py-10">
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-gray-900">
          Главная
        </Link>
        <span>/</span>
        <Link href="/cart" className="hover:text-gray-900">
          Корзина
        </Link>
        <span>/</span>
        <span className="text-gray-900">Оформление заказа</span>
      </nav>

      <h1 className="text-3xl font-bold text-white mb-8">Оформление заказа</h1>

      <form onSubmit={handleSubmit}>
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left — form */}
          <div className="flex-1 space-y-6">
            {/* Contact */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Контактные данные
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1">
                    Имя *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                    placeholder="Иван Иванов"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1">
                    Телефон *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                    placeholder="+7 (999) 123-45-67"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#374151] mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                    placeholder="email@example.com"
                  />
                </div>
              </div>
            </div>

            {/* Delivery */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Доставка
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {[
                  { id: "courier" as const, label: "Курьер", sub: "от 900 ₽" },
                  {
                    id: "pickup" as const,
                    label: "Самовывоз",
                    sub: "Бесплатно",
                  },
                  { id: "cdek" as const, label: "СДЭК", sub: "от 500 ₽" },
                  { id: "pek" as const, label: "ПЭК", sub: "от 400 ₽" },
                ].map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setDelivery(d.id)}
                    className={`p-3 border rounded-lg text-center transition-colors ${
                      delivery === d.id
                        ? "border-gray-900 bg-gray-50"
                        : "border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    <span className="block text-sm font-medium text-[#374151]">
                      {d.label}
                    </span>
                    <span className="block text-xs text-gray-500 mt-1">
                      {d.sub}
                    </span>
                  </button>
                ))}
              </div>

              {delivery !== "pickup" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#374151] mb-1">
                      Город *
                    </label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#374151] mb-1">
                      Адрес *
                    </label>
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                      placeholder="ул. Примерная, д.1, кв.1"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Payment */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Оплата
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { id: "cash" as const, label: "При получении" },
                  { id: "card" as const, label: "Картой онлайн" },
                  { id: "installment" as const, label: "Рассрочка" },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPayment(p.id)}
                    className={`p-3 border rounded-lg text-center text-sm font-medium text-[#374151] transition-colors ${
                      payment === p.id
                        ? "border-gray-900 bg-gray-50"
                        : "border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Comment */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Комментарий к заказу
              </h2>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none resize-none"
                placeholder="Дополнительные пожелания..."
              />
            </div>
          </div>

          {/* Right — summary */}
          <div className="lg:w-96">
            <div className="bg-white border border-gray-200 rounded-xl p-6 sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Ваш заказ
              </h2>

              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.productId} className="flex gap-3 text-sm">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {item.image && (
                        <img
                          src={item.image}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 line-clamp-1">{item.name}</p>
                      <p className="text-gray-500">
                        {item.quantity} x {formatPrice(item.price)} ₽
                      </p>
                    </div>
                    <span className="font-medium text-gray-900 flex-shrink-0">
                      {formatPrice(item.price * item.quantity)} ₽
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Товары ({getTotalItems()} шт.)</span>
                  <span>{formatPrice(getTotalPrice())} ₽</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Доставка</span>
                  <span>
                    {deliveryPrice === 0 ? (
                      <span className="text-[#374151]">Рассчитать</span>
                    ) : (
                      `${formatPrice(deliveryPrice)} ₽`
                    )}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-3 flex justify-between">
                  <span className="text-lg font-bold text-black">Итого</span>
                  <span className="text-lg font-bold text-black">
                    {formatPrice(getTotalPrice() + deliveryPrice)} ₽
                  </span>
                </div>
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-6 w-full bg-gray-900 text-white py-3.5 rounded-lg hover:bg-gray-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Оформляем..." : "Подтвердить заказ"}
              </button>

              <p className="text-xs text-gray-400 mt-3 text-center">
                Нажимая кнопку, вы соглашаетесь с условиями обработки
                персональных данных
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
