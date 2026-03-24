"use client";

import Link from "next/link";
import { useState } from "react";

interface RelatedProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: string[];
}

interface RelatedProductsProps {
  products: RelatedProduct[];
}

// Функция форматирования цены внутри клиентского компонента
const formatPrice = (price: number) => {
  return new Intl.NumberFormat("ru-RU").format(price);
};

export default function RelatedProducts({ products }: RelatedProductsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {products.map((relatedProduct) => (
        <RelatedProductCard key={relatedProduct.id} product={relatedProduct} />
      ))}
    </div>
  );
}

function RelatedProductCard({ product }: { product: RelatedProduct }) {
  const [imageError, setImageError] = useState(false);
  const relatedImage = product.images?.[0] || "";

  return (
    <Link
      href={`/catalog/product/${product.slug}`}
      className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
    >
      <div className="aspect-square bg-gray-100 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={
            imageError || !relatedImage
              ? "https://via.placeholder.com/200x200?text=Нет+фото"
              : relatedImage
          }
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={() => setImageError(true)}
        />
      </div>
      <div className="p-3">
        <h3 className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-gray-600 transition-colors">
          {product.name}
        </h3>
        <p className="text-sm font-bold text-gray-900 mt-1">
          {formatPrice(product.price)} ₽
        </p>
      </div>
    </Link>
  );
}
