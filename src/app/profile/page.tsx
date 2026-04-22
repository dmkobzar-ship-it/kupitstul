import { Metadata } from "next";
import Link from "next/link";
import { User } from "lucide-react";

export const metadata: Metadata = {
  title: "Личный кабинет | КупитьСтул",
  description: "Личный кабинет покупателя",
  robots: { index: false, follow: false },
};

export default function ProfilePage() {
  return (
    <div className="container py-24 flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
        <User className="w-10 h-10 text-gray-400" />
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Личный кабинет</h1>
      <p className="text-gray-500 mb-8 max-w-sm">
        Регистрация и личный кабинет скоро появятся. Пока вы можете отслеживать
        заказы по номеру телефона.
      </p>
      <div className="flex gap-4">
        <Link
          href="/catalog"
          className="bg-gray-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors"
        >
          Перейти в каталог
        </Link>
        <Link
          href="/kontakty"
          className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
        >
          Связаться с нами
        </Link>
      </div>
    </div>
  );
}
