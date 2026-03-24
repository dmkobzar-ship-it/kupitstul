"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";

interface Category {
  slug: string;
  name: string;
  count: number;
}

export default function CategorySidebar({
  categories,
}: {
  categories: Category[];
}) {
  const pathname = usePathname();
  const currentSlug = pathname.split("/catalog/")[1] || "";

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <h3 className="font-bold text-lg mb-4">Категории</h3>
      <ul className="space-y-2">
        {categories.map((category) => (
          <li key={category.slug}>
            <Link
              href={`/catalog/${category.slug}`}
              className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                currentSlug === category.slug
                  ? "bg-orange-50 text-orange-600"
                  : "hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <span>{category.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">{category.count}</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
