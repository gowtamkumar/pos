'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { showToast } from '@/lib/toast';
import { Category, Product, CartItem, Sale, DailySalesSummary } from '@/types/pos';
import { CashPaymentModal } from './cash-payment-modal';
import { ReceiptModal } from './receipt-modal';
import { AddCategoryModal } from './add-category-modal';
import { AddProductModal } from './add-product-modal';
import { AiInsightsModal } from './ai-insights-modal';
import { ThemeToggle } from '../theme-toggle';
import {
  Search,
  Barcode,
  ShoppingBag,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  DollarSign,
  Clock,
  LogOut,
  RefreshCw,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  FolderPlus,
  PackagePlus,
} from 'lucide-react';

export function PosTerminal() {
  const { user, logout } = useAuth();

  // Catalog State
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(5); // 5% standard retail tax

  // Daily Summary State
  const [dailySummary, setDailySummary] = useState<DailySalesSummary | null>(null);

  // Modals
  const [isCashModalOpen, setIsCashModalOpen] = useState<boolean>(false);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState<boolean>(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState<boolean>(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState<boolean>(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);

  const isAdmin = Boolean(user?.roles?.includes('Admin'));

  const lowStockCount = useMemo(() => {
    return products.filter((p) => p.stockQuantity <= p.lowStockThreshold).length;
  }, [products]);

  // Live Clock
  const [currentTime, setCurrentTime] = useState<string>('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Update digital clock every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Categories, Products & Today's Summary
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [catRes, prodRes, summaryRes] = await Promise.allSettled([
        api.get('/categories/active'),
        api.get('/products?limit=100'),
        api.get('/sales/summary/today'),
      ]);

      if (catRes.status === 'fulfilled') {
        const catData = catRes.value.data?.data || catRes.value.data || [];
        setCategories(Array.isArray(catData) ? catData : []);
      }

      if (prodRes.status === 'fulfilled') {
        const prodData =
          prodRes.value.data?.data?.data ||
          prodRes.value.data?.data ||
          prodRes.value.data ||
          [];
        setProducts(Array.isArray(prodData) ? prodData : []);
      }

      if (summaryRes.status === 'fulfilled') {
        const sumData = summaryRes.value.data?.data || summaryRes.value.data;
        if (sumData) setDailySummary(sumData);
      }
    } catch (err) {
      showToast('Error loading catalog data', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Add to Cart
  const handleAddToCart = useCallback((product: Product) => {
    if (product.stockQuantity <= 0) {
      showToast(`'${product.name}' is currently out of stock`, 'warning');
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stockQuantity) {
          showToast(`Cannot add more. Max stock available is ${product.stockQuantity}`, 'warning');
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  }, []);

  // Barcode Scanner Listener: Captures rapid barcode scanner enter presses
  const handleSearchKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const code = searchQuery.trim();
      if (!code) return;

      // 1. First check if barcode matches in memory
      const matchedLocal = products.find(
        (p) => p.barcode.toLowerCase() === code.toLowerCase() || p.sku.toLowerCase() === code.toLowerCase()
      );

      if (matchedLocal) {
        handleAddToCart(matchedLocal);
        showToast(`Scanned: ${matchedLocal.name}`, 'success');
        setSearchQuery('');
        return;
      }

      // 2. Otherwise query backend barcode API
      try {
        const res = await api.get(`/products/barcode/${encodeURIComponent(code)}`);
        const remoteProduct = res.data?.data || res.data;
        if (remoteProduct && remoteProduct.id) {
          handleAddToCart(remoteProduct);
          showToast(`Scanned: ${remoteProduct.name}`, 'success');
          setSearchQuery('');
        }
      } catch (err) {
        showToast(`No product found for code '${code}'`, 'warning');
      }
    }
  };

  // Adjust Cart Item Quantity
  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const nextQty = item.quantity + delta;
            if (nextQty <= 0) return null; // Will filter out
            if (nextQty > item.product.stockQuantity) {
              showToast(
                `Cannot exceed available shelf stock (${item.product.stockQuantity})`,
                'warning'
              );
              return item;
            }
            return { ...item, quantity: nextQty };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  // Remove from Cart
  const handleRemoveItem = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // Clear Cart
  const handleClearCart = () => {
    if (cart.length > 0) {
      setCart([]);
      showToast('Cart cleared', 'info');
    }
  };

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Category filter
      if (selectedCategory !== 'all' && product.categoryId !== selectedCategory) {
        return false;
      }
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = product.name.toLowerCase().includes(q);
        const matchesSku = product.sku.toLowerCase().includes(q);
        const matchesBarcode = product.barcode.toLowerCase().includes(q);
        if (!matchesName && !matchesSku && !matchesBarcode) return false;
      }
      return true;
    });
  }, [products, selectedCategory, searchQuery]);

  // Financial Computations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => {
      const price = Number(item.product.retailPrice) || 0;
      return sum + price * item.quantity;
    }, 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    return Math.min(subtotal, Math.max(0, Number(discount) || 0));
  }, [subtotal, discount]);

  const taxableAmount = useMemo(() => {
    return Math.max(0, subtotal - discountAmount);
  }, [subtotal, discountAmount]);

  const taxAmount = useMemo(() => {
    return Number(((taxableAmount * (Number(taxRate) || 0)) / 100).toFixed(2));
  }, [taxableAmount, taxRate]);

  const total = useMemo(() => {
    return Number((taxableAmount + taxAmount).toFixed(2));
  }, [taxableAmount, taxAmount]);

  const totalItemCount = useMemo(() => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  }, [cart]);

  // Callback when checkout succeeds
  const handleCheckoutSuccess = (sale: Sale) => {
    setIsCashModalOpen(false);
    setCart([]);
    setDiscount(0);
    setCompletedSale(sale);
    setIsReceiptModalOpen(true);
    fetchData(); // Refresh catalog stock and today's summary
  };

  const handleCategoryCreated = (newCategory: Category) => {
    setCategories((prev) => [...prev, newCategory]);
    setSelectedCategory(newCategory.id);
  };

  const handleProductCreated = (newProduct: Product) => {
    setProducts((prev) => [newProduct, ...prev]);
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans select-none transition-colors duration-200">
      {/* ── TOP HEADER / SHIFT BAR ── */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 backdrop-blur px-6 py-3 flex items-center justify-between no-print sticky top-0 z-30 shadow-sm dark:shadow-md transition-colors">
        {/* Brand & Live Digital Clock */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-tight text-slate-900 dark:text-white leading-tight">
                Retail POS Terminal
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                <span>{currentTime || 'Loading clock...'}</span>
              </p>
            </div>
          </div>

          {/* Shift Revenue Badge */}
          {dailySummary && (
            <div className="hidden md:flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
                <DollarSign className="w-3.5 h-3.5" />
                <span>Today: ${Number(dailySummary.totalRevenue).toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 text-xs font-medium">
                <TrendingUp className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>{dailySummary.totalTransactions} Txns</span>
              </div>
            </div>
          )}

          {/* AI Copilot Badge Button */}
          <button
            onClick={() => setIsAiModalOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20 cursor-pointer relative group"
            title="Open AI Sales Copilot & Restock Forecast"
          >
            <Sparkles className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
            <span>AI Copilot</span>
            {lowStockCount > 0 && (
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 absolute -top-1 -right-1 ring-2 ring-white dark:ring-slate-900 animate-pulse" />
            )}
          </button>
        </div>

        {/* Right Controls: AI Copilot (mobile), Theme Toggle, Refresh, Cashier Badge & Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsAiModalOpen(true)}
            className="sm:hidden p-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white transition-all shadow-md cursor-pointer relative"
            title="Open AI Sales Copilot"
          >
            <Sparkles className="w-4 h-4" />
            {lowStockCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 absolute -top-0.5 -right-0.5 ring-2 ring-white dark:ring-slate-900 animate-pulse" />
            )}
          </button>

          <ThemeToggle />

          <button
            onClick={() => fetchData()}
            title="Refresh Catalog"
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          {user && (
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="text-left leading-tight hidden sm:block">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[120px]">{user.name}</p>
                <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
                  {user.roles?.includes('Admin') ? 'Store Admin' : 'Cashier'}
                </p>
              </div>
            </div>
          )}

          <button
            onClick={() => logout()}
            title="Sign Out"
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-900/40 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ── MAIN POS WORKSPACE ── */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden max-w-[1600px] w-full mx-auto p-4 gap-4">
        {/* ── LEFT PANEL: PRODUCT CATALOG & BARCODE SCANNER (65%) ── */}
        <div className="flex-1 flex flex-col bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800/80 overflow-hidden shadow-sm dark:shadow-xl transition-colors">
          {/* Search & Barcode Scan Bar */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row gap-3 bg-slate-50/80 dark:bg-slate-900/80 items-stretch sm:items-center transition-colors">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search products or scan barcode (Press Enter to scan)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-all shadow-xs"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
                <Barcode className="w-4 h-4" />
              </div>
            </div>

            {isAdmin && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddCategoryOpen(true)}
                  className="px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer shadow-xs"
                  title="Add new department category"
                >
                  <FolderPlus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Category</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddProductOpen(true)}
                  className="px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20 flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                  title="Add new product"
                >
                  <PackagePlus className="w-4 h-4" />
                  <span>+ Product</span>
                </button>
              </div>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800/60 overflow-x-auto flex items-center gap-2 scrollbar-none bg-slate-50/50 dark:bg-slate-900/40 transition-colors">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                  : 'bg-white dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700/60 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              All Items ({products.length})
            </button>

            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                    : 'bg-white dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700/60 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {cat.name}
              </button>
            ))}

            {isAdmin && (
              <button
                type="button"
                onClick={() => setIsAddCategoryOpen(true)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border border-dashed border-indigo-300 dark:border-indigo-500/50 hover:border-indigo-500 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-600/10 flex items-center gap-1.5 ml-1 cursor-pointer"
                title="Add new department category"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>+ Category</span>
              </button>
            )}
          </div>

          {/* Product Cards Grid */}
          <div className="flex-1 p-4 overflow-y-auto">
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="h-36 rounded-2xl bg-slate-200/60 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 animate-pulse"
                  />
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 text-center p-6">
                <ShoppingBag className="w-12 h-12 stroke-1 mb-2 text-slate-400 dark:text-slate-600" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-400">No products matched</p>
                <p className="text-xs text-slate-500 dark:text-slate-600 mt-1">
                  Try another search query or choose "All Items"
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredProducts.map((product) => {
                  const isOutOfStock = product.stockQuantity <= 0;
                  const isLowStock =
                    product.stockQuantity > 0 &&
                    product.stockQuantity <= product.lowStockThreshold;

                  return (
                    <button
                      key={product.id}
                      onClick={() => handleAddToCart(product)}
                      disabled={isOutOfStock}
                      className={`text-left p-3.5 rounded-2xl border transition-all flex flex-col justify-between group relative overflow-hidden ${
                        isOutOfStock
                          ? 'bg-slate-100/60 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800/40 opacity-50 cursor-not-allowed'
                          : 'bg-white dark:bg-slate-900/80 hover:bg-slate-50 dark:hover:bg-slate-800/90 border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500/60 hover:shadow-md hover:shadow-indigo-500/10 cursor-pointer active:scale-[0.98]'
                      }`}
                    >
                      {/* Top Badges */}
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
                            {product.category?.name || 'Retail'}
                          </span>

                          {/* Stock status badge */}
                          {isOutOfStock ? (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20">
                              Out of Stock
                            </span>
                          ) : isLowStock ? (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 flex items-center gap-0.5">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              <span>{product.stockQuantity} left</span>
                            </span>
                          ) : (
                            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                              {product.stockQuantity} in stock
                            </span>
                          )}
                        </div>

                        {/* Title & SKU */}
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors line-clamp-2 leading-snug">
                          {product.name}
                        </h4>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">{product.sku}</p>
                      </div>

                      {/* Bottom Price & Barcode */}
                      <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-end justify-between">
                        <div>
                          <span className="text-sm font-black text-slate-900 dark:text-white">
                            ${Number(product.retailPrice).toFixed(2)}
                          </span>
                        </div>

                        <div className="text-[9px] font-mono text-slate-400 dark:text-slate-500 flex items-center gap-1">
                          <Barcode className="w-3 h-3 text-slate-400 dark:text-slate-600" />
                          <span>{product.barcode.slice(-4)}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT PANEL: LIVE CART DRAWER & CASH REGISTER (35%) ── */}
        <div className="w-full lg:w-[420px] flex flex-col bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl overflow-hidden transition-colors">
          {/* Cart Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-950/60 transition-colors">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Current Order</h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-500/30">
                {totalItemCount}
              </span>
            </div>

            {cart.length > 0 && (
              <button
                onClick={handleClearCart}
                className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 transition-colors flex items-center gap-1 hover:underline cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear Cart
              </button>
            )}
          </div>

          {/* Cart Items List */}
          <div className="flex-1 p-3 overflow-y-auto space-y-2">
            {cart.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 text-center p-6 space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800/40 flex items-center justify-center text-slate-400 dark:text-slate-600 border border-slate-200 dark:border-slate-800">
                  <ShoppingCart className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Cart is empty</p>
                <p className="text-xs text-slate-500 max-w-[200px] leading-relaxed">
                  Scan barcode with handheld scanner or tap products to begin checkout.
                </p>
              </div>
            ) : (
              cart.map((item) => {
                const lineTotal = Number(item.product.retailPrice) * item.quantity;
                return (
                  <div
                    key={item.product.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-3 group hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                  >
                    {/* Item Details */}
                    <div className="flex-1 truncate pr-1">
                      <p className="font-bold text-xs text-slate-900 dark:text-white truncate">{item.product.name}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                        ${Number(item.product.retailPrice).toFixed(2)} × {item.quantity}
                      </p>
                    </div>

                    {/* Quantity Stepper & Line Price */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                        <button
                          onClick={() => handleUpdateQuantity(item.product.id, -1)}
                          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold text-slate-900 dark:text-white">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleUpdateQuantity(item.product.id, 1)}
                          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-right w-16">
                        <p className="text-xs font-bold text-slate-900 dark:text-white">${lineTotal.toFixed(2)}</p>
                      </div>

                      <button
                        onClick={() => handleRemoveItem(item.product.id)}
                        className="text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pricing & Checkout Summary */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/80 space-y-3 transition-colors">
            {/* Quick Adjustment Inputs: Discount & Tax */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                  Discount ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={discount === 0 ? '' : discount}
                  placeholder="0.00"
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                  Tax Rate (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={taxRate}
                  onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:border-indigo-500 outline-none"
                />
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>Discount</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
              )}

              {taxAmount > 0 && (
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Tax ({taxRate}%)</span>
                  <span>${taxAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-800">
                <span className="font-bold text-sm text-slate-900 dark:text-white">Net Total Payable:</span>
                <span className="font-black text-2xl text-emerald-600 dark:text-emerald-400">${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Pay Cash Button */}
            <button
              onClick={() => setIsCashModalOpen(true)}
              disabled={cart.length === 0}
              className={`w-full py-3.5 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
                cart.length > 0
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 cursor-pointer active:scale-[0.99]'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-slate-800'
              }`}
            >
              <DollarSign className="w-5 h-5" />
              <span>Proceed to Cash Tender (${total.toFixed(2)})</span>
            </button>
          </div>
        </div>
      </main>

      {/* ── MODALS ── */}
      <CashPaymentModal
        isOpen={isCashModalOpen}
        onClose={() => setIsCashModalOpen(false)}
        cart={cart}
        subtotal={subtotal}
        discount={discountAmount}
        taxRate={taxRate}
        total={total}
        onCheckoutComplete={handleCheckoutSuccess}
      />

      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        sale={completedSale}
      />

      <AddCategoryModal
        isOpen={isAddCategoryOpen}
        onClose={() => setIsAddCategoryOpen(false)}
        onCategoryCreated={handleCategoryCreated}
      />

      <AddProductModal
        isOpen={isAddProductOpen}
        onClose={() => setIsAddProductOpen(false)}
        categories={categories}
        onProductCreated={handleProductCreated}
      />

      <AiInsightsModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
      />
    </div>
  );
}

