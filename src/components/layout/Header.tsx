"use client";

import {
  ShoppingCart,
  Search,
  Menu,
  User,
  Heart,
  X,
  ChevronDown,
  Phone,
  MapPin,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { useFavorites } from "@/components/cart/FavoritesProvider";

// Мега-меню категорий — реальные категории из импорта (захардкожены для клиентского компонента)
const catalogMenu = {
  "По типу": [
    { name: "Барные стулья", href: "/catalog/barnye-stulya", count: 1461 },
    { name: "Стулья", href: "/catalog/stulya", count: 301 },
    { name: "Кресла", href: "/catalog/kresla", count: 245 },
    { name: "Столы", href: "/catalog/stoly", count: 184 },
    { name: "Кровати", href: "/catalog/krovati", count: 172 },
    { name: "Пуфы и банкетки", href: "/catalog/pufy", count: 158 },
    { name: "Комоды", href: "/catalog/komody", count: 45 },
    { name: "Стеллажи", href: "/catalog/stellazhi", count: 40 },
    {
      name: "Компьютерные кресла",
      href: "/catalog/kompyuternye-kresla",
      count: 36,
    },
    { name: "Диваны", href: "/catalog/divany", count: 30 },
  ],
  "По комнате": [
    { name: "Для кухни", href: "/catalog?room=kitchen" },
    { name: "Для гостиной", href: "/catalog?room=living" },
    { name: "Для спальни", href: "/catalog?room=bedroom" },
    { name: "Для офиса", href: "/catalog?room=office" },
    { name: "Для прихожей", href: "/catalog?room=hallway" },
  ],
  "По стилю": [
    { name: "Лофт", href: "/catalog?style=loft" },
    { name: "Скандинавский", href: "/catalog?style=scandi" },
    { name: "Классика", href: "/catalog?style=classic" },
    { name: "Модерн", href: "/catalog?style=modern" },
    { name: "Минимализм", href: "/catalog?style=minimal" },
  ],
};

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { getTotalItems } = useCart();
  const cartCount = getTotalItems();
  const { getFavoritesCount } = useFavorites();
  const favoritesCount = getFavoritesCount();

  // Category slug to Russian name mapping
  const categoryNamesMap: Record<string, string> = {
    "barnye-stulya": "Барные стулья",
    stulya: "Стулья",
    kresla: "Кресла",
    stoly: "Столы",
    krovati: "Кровати",
    pufy: "Пуфы и банкетки",
    komody: "Комоды",
    stellazhi: "Стеллажи",
    "kompyuternye-kresla": "Компьютерные кресла",
    divany: "Диваны",
    "tumby-tv": "Тумбы ТВ",
    tumby: "Тумбы",
    shkafy: "Шкафы",
    "ofisnye-stulya": "Офисные стулья",
    zerkala: "Зеркала",
    "sadovaya-mebel": "Садовая мебель",
  };

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    {
      id: string;
      name: string;
      slug: string;
      price: number;
      image?: string;
      category: string;
    }[]
  >([]);
  const [matchedCategory, setMatchedCategory] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      setMatchedCategory(null);
      return;
    }
    setIsSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(searchQuery)}`,
        );
        const data = await res.json();
        setSearchResults(data.results || []);
        setMatchedCategory(data.matchedCategory || null);
      } catch {
        setSearchResults([]);
        setMatchedCategory(null);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery]);

  // Close search on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
        setSearchQuery("");
        setSearchResults([]);
      }
    };
    if (isSearchOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isSearchOpen]);

  return (
    <>
      {/* Верхняя полоса */}
      <div className="bg-[var(--bg-dark)] text-white text-sm py-2 hidden md:block">
        <div className="container flex justify-between items-center">
          <div className="flex items-center gap-6">
            <a
              href="tel:+79269084158"
              className="flex items-center gap-2 hover:text-[var(--color-accent)] transition-colors"
            >
              <Phone className="w-4 h-4" />
              +7 (926) 908-41-58
            </a>
            <span className="text-gray-400">Ежедневно 9:00 — 21:00</span>
          </div>
          <div className="flex items-center gap-6">
            <Link
              href="/admin"
              className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] px-3 py-1 rounded text-white font-medium transition-colors"
            >
              Админка
            </Link>
            <Link
              href="/dostavka"
              className="hover:text-[var(--color-accent)] transition-colors"
            >
              Доставка
            </Link>

            <Link
              href="/kontakty"
              className="hover:text-[var(--color-accent)] transition-colors flex items-center gap-1"
            >
              <MapPin className="w-4 h-4" />
              Москва
            </Link>
          </div>
        </div>
      </div>

      {/* Основной хедер */}
      <header
        className={`sticky top-0 z-50 bg-white transition-all duration-300 ${
          isScrolled ? "shadow-md" : "border-b border-[var(--border-light)]"
        }`}
      >
        <div className="container">
          <div className="flex items-center justify-between h-20">
            {/* Логотип */}
            <Link href="/" className="flex items-center gap-2">
              <div className="flex flex-col">
                <span className="text-2xl font-bold tracking-tight text-[var(--color-primary)]">
                  КУПИТЬ<span className="text-[var(--color-accent)]">СТУЛ</span>
                </span>
                <span className="text-[10px] text-[var(--text-secondary)] tracking-widest uppercase">
                  Премиальная мебель
                </span>
              </div>
            </Link>

            {/* Навигация */}
            <nav className="hidden lg:flex items-center gap-1">
              {/* Каталог с мега-меню */}
              <div
                className="relative"
                onMouseEnter={() => setIsCatalogOpen(true)}
                onMouseLeave={() => setIsCatalogOpen(false)}
              >
                <Link
                  href="/catalog"
                  className="flex items-center gap-1 px-4 py-2 font-medium text-[#374151] hover:text-[var(--color-accent)] transition-colors"
                >
                  Каталог
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${isCatalogOpen ? "rotate-180" : ""}`}
                  />
                </Link>

                {/* Мега-меню */}
                {isCatalogOpen && (
                  <div className="absolute top-full left-0 w-[800px] bg-white shadow-xl rounded-b-lg border border-[var(--border-light)] p-6 grid grid-cols-3 gap-8 animate-fade-in">
                    {Object.entries(catalogMenu).map(([title, items]) => (
                      <div key={title}>
                        <h3 className="font-semibold text-gray-900 mb-3">
                          {title}
                        </h3>
                        <ul className="space-y-2">
                          {items.map((item) => (
                            <li key={item.name}>
                              <Link
                                href={item.href}
                                className="flex items-center justify-between text-[var(--text-secondary)] hover:text-[var(--color-primary)] transition-colors"
                              >
                                <span>{item.name}</span>
                                {"count" in item && (
                                  <span className="text-xs text-[var(--text-muted)]">
                                    {item.count}
                                  </span>
                                )}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                    <div className="col-span-3 pt-4 border-t border-[var(--border-light)]">
                      <Link
                        href="/catalog"
                        className="text-[var(--color-accent)] font-medium hover:underline"
                      >
                        Смотреть весь каталог →
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              <Link
                href="/novinki"
                className="px-4 py-2 font-medium text-[#374151] hover:text-[var(--color-accent)] transition-colors"
              >
                Новинки
              </Link>
              <Link
                href="/sale"
                className="px-4 py-2 font-medium text-red-600 hover:text-red-700 transition-colors"
              >
                Sale
              </Link>
              <Link
                href="/blog"
                className="px-4 py-2 font-medium text-[#374151] hover:text-[var(--color-accent)] transition-colors"
              >
                Блог
              </Link>
              <Link
                href="/o-nas"
                className="px-4 py-2 font-medium text-[#374151] hover:text-[var(--color-accent)] transition-colors"
              >
                О нас
              </Link>
            </nav>

            {/* Поиск и действия */}
            <div className="flex items-center gap-2">
              {/* Поиск */}
              <div className="relative hidden md:block">
                <button
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                  className="p-3 hover:bg-[var(--bg-secondary)] rounded-full transition-colors text-gray-700"
                >
                  <Search className="w-5 h-5" />
                </button>
              </div>

              {/* Избранное */}
              <Link
                href="/favorites"
                className="relative p-3 hover:bg-[var(--bg-secondary)] rounded-full transition-colors hidden md:flex text-gray-700"
              >
                <Heart className="w-5 h-5" />
                {favoritesCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-[var(--color-accent)] text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-medium">
                    {favoritesCount}
                  </span>
                )}
              </Link>

              {/* Профиль */}
              <Link
                href="/profile"
                className="p-3 hover:bg-[var(--bg-secondary)] rounded-full transition-colors hidden md:flex text-gray-700"
              >
                <User className="w-5 h-5" />
              </Link>

              {/* Корзина */}
              <Link
                href="/cart"
                className="relative flex items-center gap-2 bg-[var(--color-primary)] text-white px-4 py-2.5 rounded-lg hover:bg-[#333] transition-colors"
              >
                <ShoppingCart className="w-5 h-5" />
                <span className="hidden sm:inline font-medium">Корзина</span>
                {cartCount > 0 && (
                  <span className="bg-[var(--color-accent)] text-white text-xs px-2 py-0.5 rounded-full">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* Мобильное меню */}
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-3 hover:bg-[var(--bg-secondary)] rounded-full transition-colors text-gray-700"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Поисковая строка — премиальная анимация */}
      {isSearchOpen && (
        <div
          className="fixed inset-0 z-50 search-overlay-backdrop"
          onClick={() => {
            setIsSearchOpen(false);
            setSearchQuery("");
            setSearchResults([]);
          }}
        >
          <div
            ref={searchRef}
            className="search-panel-slide"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="container py-6">
              {/* Search input row */}
              <div className="flex items-center gap-4 search-input-row">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Что вы ищете? Стулья, столы, кресла..."
                    className="w-full pl-12 pr-4 py-4 text-lg bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-[var(--color-accent)] focus:bg-white transition-all duration-300"
                    autoFocus
                  />
                </div>
                {isSearching && (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-[var(--color-accent)] rounded-full animate-spin" />
                  </div>
                )}
                <button
                  onClick={() => {
                    setIsSearchOpen(false);
                    setSearchQuery("");
                    setSearchResults([]);
                  }}
                  className="p-3 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:rotate-90 flex-shrink-0"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Quick category chips */}
              {searchResults.length === 0 && !searchQuery && (
                <div className="mt-5 search-chips-row">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
                    Популярные запросы
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: "Барные стулья", slug: "barnye-stulya" },
                      { label: "Офисные кресла", slug: "kompyuternye-kresla" },
                      { label: "Обеденные столы", slug: "stoly" },
                      { label: "Комоды", slug: "komody" },
                      { label: "Стеллажи", slug: "stellazhi" },
                      { label: "Кресла", slug: "kresla" },
                    ].map((chip, i) => (
                      <Link
                        key={chip.slug}
                        href={`/catalog/${chip.slug}`}
                        onClick={() => {
                          setIsSearchOpen(false);
                          setSearchQuery("");
                          setSearchResults([]);
                        }}
                        className="px-4 py-2 bg-gray-50 hover:bg-[var(--color-accent)] hover:text-white text-gray-600 text-sm rounded-full transition-all duration-300 hover:scale-105 hover:shadow-md"
                        style={{ animationDelay: `${i * 60}ms` }}
                      >
                        {chip.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Search results — staggered */}
              {searchResults.length > 0 && (
                <div className="mt-5 pt-5 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">
                    Найдено {searchResults.length} товаров
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[55vh] overflow-y-auto pr-1 search-results-grid">
                    {searchResults.map((r, idx) => (
                      <Link
                        key={r.id}
                        href={`/catalog/product/${r.slug}`}
                        onClick={() => {
                          setIsSearchOpen(false);
                          setSearchQuery("");
                          setSearchResults([]);
                        }}
                        className="group flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50 transition-all duration-300 hover:shadow-sm search-result-card"
                        style={{ animationDelay: `${idx * 50}ms` }}
                      >
                        <div className="relative w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100 group-hover:shadow-md transition-shadow duration-300">
                          <Image
                            src={
                              r.image ||
                              `https://picsum.photos/seed/${r.id}/100/100`
                            }
                            alt={r.name}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                            sizes="64px"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                `https://picsum.photos/seed/${r.id}/100/100`;
                            }}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate group-hover:text-[var(--color-accent)] transition-colors duration-200">
                            {r.name}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {categoryNamesMap[r.category] || r.category}
                          </p>
                          <p className="text-sm font-bold text-gray-800 mt-1">
                            {r.price.toLocaleString("ru-RU")} ₽
                          </p>
                        </div>
                        <ChevronDown className="w-4 h-4 text-gray-300 -rotate-90 group-hover:text-[var(--color-accent)] group-hover:translate-x-1 transition-all duration-200 flex-shrink-0" />
                      </Link>
                    ))}
                  </div>
                  <div className="text-center pt-4 mt-2 border-t border-gray-100">
                    <Link
                      href={
                        matchedCategory
                          ? `/catalog/${matchedCategory}`
                          : `/catalog?q=${encodeURIComponent(searchQuery)}`
                      }
                      onClick={() => {
                        setIsSearchOpen(false);
                        setSearchQuery("");
                        setSearchResults([]);
                      }}
                      className="inline-flex items-center gap-2 text-sm text-[var(--color-accent)] font-medium hover:underline hover:gap-3 transition-all duration-200"
                    >
                      {matchedCategory
                        ? `Все ${categoryNamesMap[matchedCategory] || matchedCategory}`
                        : "Смотреть все результаты"}
                      <span className="text-lg">→</span>
                    </Link>
                  </div>
                </div>
              )}

              {/* No results */}
              {searchQuery.length >= 2 &&
                !isSearching &&
                searchResults.length === 0 && (
                  <div className="mt-5 pt-5 border-t border-gray-100 text-center py-8 search-no-results">
                    <div className="text-4xl mb-3">🔍</div>
                    <p className="text-gray-500 text-sm">
                      Ничего не найдено по запросу «
                      <span className="font-medium text-gray-700">
                        {searchQuery}
                      </span>
                      »
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
                      Попробуйте изменить запрос
                    </p>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}

      {/* Мобильное меню */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-white shadow-xl animate-slide-in overflow-y-auto">
            <div className="p-4 border-b border-[var(--border-light)] flex justify-between items-center">
              <span className="font-semibold text-lg">Меню</span>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 hover:bg-[var(--bg-secondary)] rounded-full"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <nav className="p-4">
              <Link
                href="/catalog"
                className="block py-3 font-medium border-b border-[var(--border-light)]"
              >
                Каталог
              </Link>
              <Link
                href="/novinki"
                className="block py-3 font-medium border-b border-[var(--border-light)]"
              >
                Новинки
              </Link>
              <Link
                href="/sale"
                className="block py-3 font-medium text-red-600 border-b border-[var(--border-light)]"
              >
                Sale
              </Link>
              <Link
                href="/blog"
                className="block py-3 font-medium border-b border-[var(--border-light)]"
              >
                Блог
              </Link>
              <Link
                href="/dostavka"
                className="block py-3 font-medium border-b border-[var(--border-light)]"
              >
                Доставка
              </Link>
              <Link
                href="/kontakty"
                className="block py-3 font-medium border-b border-[var(--border-light)]"
              >
                Контакты
              </Link>
              <Link href="/o-nas" className="block py-3 font-medium">
                О нас
              </Link>
            </nav>
            <div className="p-4 border-t border-[var(--border-light)]">
              <a
                href="tel:+79269084158"
                className="flex items-center gap-2 text-[var(--color-accent)] font-medium"
              >
                <Phone className="w-5 h-5" />
                +7 (926) 908-41-58
              </a>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                Ежедневно 9:00 — 21:00
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
