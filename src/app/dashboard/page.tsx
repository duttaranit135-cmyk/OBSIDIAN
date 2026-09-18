"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import "./dashboard.css";



interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  emoji: string;
  category: string;
  description: string;
  status?: string;
  discountPrice?: number;
  image?: string;
}

const SAMPLE_CATALOG_TEMPLATES: Product[] = [];

const SAMPLE_ORDER_TEMPLATES: Order[] = [];

interface Order {
  id: number;
  customerName: string;
  productName: string;
  productId: number;
  quantity: number;
  totalPrice: number;
  status: "completed" | "pending" | "processing";
  date: string;
}


export default function DashboardPage() {
  const router = useRouter();

  // Active Tab
  const [activeTab, setActiveTab] = useState<"overview" | "products" | "orders" | "settings">("overview");

  // Profile States
  const [ownerName, setOwnerName] = useState("Store Owner");
  const [shopName, setShopName] = useState("OBSIDIAN Store");
  const [businessType, setBusinessType] = useState("clothing");
  const [currency, setCurrency] = useState("₹");

  // Catalog & Orders (Clean by default - all default examples removed)
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // Search & Filter
  const [productSearch, setProductSearch] = useState("");
  const [orderFilter, setOrderFilter] = useState("all");

  // Modals
  const [showProductModal, setShowProductModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showStorePreview, setShowStorePreview] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Sample Chooser States (Manual selection)
  const [showSampleChooserModal, setShowSampleChooserModal] = useState(false);
  const [showSampleOrderModal, setShowSampleOrderModal] = useState(false);
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<number[]>([]);
  const [selectedOrderTemplateIds, setSelectedOrderTemplateIds] = useState<number[]>([]);
  const [sampleCategoryFilter, setSampleCategoryFilter] = useState("all");

  // Form States for Product Modal
  const [formName, setFormName] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formStock, setFormStock] = useState("10");
  const [formEmoji, setFormEmoji] = useState("📦");
  const [formCategory, setFormCategory] = useState("General");
  const [formDesc, setFormDesc] = useState("");

  // Form States for Order Modal
  const [orderCustomer, setOrderCustomer] = useState("");
  const [orderProductId, setOrderProductId] = useState<number | "">("");
  const [orderQty, setOrderQty] = useState(1);
  const [orderCalculatedPrice, setOrderCalculatedPrice] = useState(0);

  // Stitch Dashboard Timeframe & QR Modal
  const [chartTimeframe, setChartTimeframe] = useState<"daily" | "weekly" | "monthly" | "yearly">("weekly");
  const [showQrModal, setShowQrModal] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
  };

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  // Storefront live URL state
  const [storefrontUrl, setStorefrontUrl] = useState("");

  // Auth guard and user state
  const [authLoading, setAuthLoading] = useState(true);
  const [userId, setUserId] = useState<string>("");
  const [isGuestUser, setIsGuestUser] = useState<boolean>(false);

  // Authenticate session and load local store state
  useEffect(() => {
    try {
      const storedSession = localStorage.getItem("obsidian_session");
      let currentUserId = "local_user";
      if (storedSession) {
        try {
          const user = JSON.parse(storedSession);
          if (user?.id) currentUserId = user.id;
          if (user?.full_name) setOwnerName(user.full_name);
        } catch {
          // ignore
        }
      }
      setUserId(currentUserId);

      const storedOwner = localStorage.getItem("ownerName");
      if (storedOwner) setOwnerName(storedOwner);

      const storedShop = localStorage.getItem("shopName") || "OBSIDIAN Store";
      setShopName(storedShop);

      const storedType = localStorage.getItem("businessType") || "clothing";
      const storedCurrency = localStorage.getItem("storeCurrency") || localStorage.getItem("currency") || "₹";
      setBusinessType(storedType);
      setCurrency(storedCurrency);

      // Load products from either obsidian_products or products
      const rawProducts = localStorage.getItem("obsidian_products") || localStorage.getItem("products");
      if (rawProducts) {
        try {
          const parsed = JSON.parse(rawProducts);
          if (Array.isArray(parsed)) {
            setProducts(parsed);
            localStorage.setItem("obsidian_products", JSON.stringify(parsed));
            localStorage.setItem("products", JSON.stringify(parsed));
          } else {
            setProducts([]);
          }
        } catch {
          setProducts([]);
        }
      } else {
        setProducts([]);
        localStorage.setItem("obsidian_products", JSON.stringify([]));
        localStorage.setItem("products", JSON.stringify([]));
      }

      // Load orders from either obsidian_orders or orders
      const rawOrders = localStorage.getItem("obsidian_orders") || localStorage.getItem("orders");
      if (rawOrders) {
        try {
          const parsed = JSON.parse(rawOrders);
          if (Array.isArray(parsed)) {
            setOrders(parsed);
            localStorage.setItem("obsidian_orders", JSON.stringify(parsed));
            localStorage.setItem("orders", JSON.stringify(parsed));
          } else {
            setOrders([]);
          }
        } catch {
          setOrders([]);
        }
      } else {
        setOrders([]);
        localStorage.setItem("obsidian_orders", JSON.stringify([]));
        localStorage.setItem("orders", JSON.stringify([]));
      }
    } catch (err) {
      console.error("Dashboard initialization error:", err);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  // Compute live storefront URL dynamically based on shopName and current origin
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storeSlug = shopName.toLowerCase().replace(/\s+/g, "-");
      const base = window.location.origin || "http://localhost:3000";
      setStorefrontUrl(`${base}/store/${storeSlug}`);
    }
  }, [shopName]);

  // Real-time synchronization when orders are placed or products updated in other tabs
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const rawProducts = localStorage.getItem("obsidian_products") || localStorage.getItem("products");
        if (rawProducts) {
          const parsed = JSON.parse(rawProducts);
          if (Array.isArray(parsed)) setProducts(parsed);
        }
        const rawOrders = localStorage.getItem("obsidian_orders") || localStorage.getItem("orders");
        if (rawOrders) {
          const parsed = JSON.parse(rawOrders);
          if (Array.isArray(parsed)) setOrders(parsed);
        }
      } catch (err) {
        console.error("Storage sync error:", err);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("focus", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("focus", handleStorageChange);
    };
  }, []);

  // Save changes helpers with localStorage persistence (synced to both keys)
  const updateProductList = (newProducts: Product[]) => {
    setProducts(newProducts);
    localStorage.setItem("obsidian_products", JSON.stringify(newProducts));
    localStorage.setItem("products", JSON.stringify(newProducts));
  };

  const updateOrderList = (newOrders: Order[]) => {
    setOrders(newOrders);
    localStorage.setItem("obsidian_orders", JSON.stringify(newOrders));
    localStorage.setItem("orders", JSON.stringify(newOrders));
  };

  // Dynamic Statistics
  const totalProducts = products.length;
  const totalStockCount = products.reduce((acc, p) => acc + p.stock, 0);
  const totalOrdersCount = orders.length;
  const totalRevenue = orders.reduce((acc, o) => acc + o.totalPrice, 0);
  const uniqueCustomers = new Set(orders.map((o) => o.customerName)).size;

  // Stitch Dashboard Low Stock Statistics & Quick Restock
  const lowStockProducts = products.filter((p) => p.stock <= 5);
  const lowStockCount = lowStockProducts.length;

  const handleQuickRestock = (productId: number, productName: string) => {
    const updated = products.map((p) =>
      p.id === productId ? { ...p, stock: p.stock + 10 } : p
    );
    updateProductList(updated);
    triggerToast(`Restocked "${productName}" (+10 units added)! 📦`);
  };

  // Manual Template Selection Handlers ("choose manually then show it")
  const toggleTemplateSelection = (id: number) => {
    setSelectedTemplateIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAllTemplates = () => {
    const filtered = sampleCategoryFilter === "all"
      ? SAMPLE_CATALOG_TEMPLATES
      : SAMPLE_CATALOG_TEMPLATES.filter(t => t.category.toLowerCase() === sampleCategoryFilter.toLowerCase());
    setSelectedTemplateIds(filtered.map((t) => t.id));
  };

  const deselectAllTemplates = () => {
    setSelectedTemplateIds([]);
  };

  const handleAddSelectedTemplates = () => {
    if (selectedTemplateIds.length === 0) {
      triggerToast("Please choose at least one product template!");
      return;
    }
    const chosenTemplates = SAMPLE_CATALOG_TEMPLATES.filter((t) =>
      selectedTemplateIds.includes(t.id)
    );
    const newItems: Product[] = chosenTemplates.map((t, idx) => ({
      ...t,
      id: Date.now() + idx,
    }));
    const updated = [...newItems, ...products];
    updateProductList(updated);
    setShowSampleChooserModal(false);
    setSelectedTemplateIds([]);
    triggerToast(`Added ${newItems.length} chosen items to dashboard! ✨`);
  };

  const handleAddSingleTemplate = (template: Product) => {
    const newProd: Product = {
      ...template,
      id: Date.now(),
    };
    updateProductList([newProd, ...products]);
    triggerToast(`Added "${template.name}" to store catalog! ✨`);
  };

  const toggleOrderTemplateSelection = (id: number) => {
    setSelectedOrderTemplateIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAllOrderTemplates = () => {
    setSelectedOrderTemplateIds(SAMPLE_ORDER_TEMPLATES.map((o) => o.id));
  };

  const handleAddSelectedOrders = () => {
    if (selectedOrderTemplateIds.length === 0) {
      triggerToast("Please choose at least one sample order!");
      return;
    }
    const chosen = SAMPLE_ORDER_TEMPLATES.filter((o) =>
      selectedOrderTemplateIds.includes(o.id)
    );
    const newOrders: Order[] = chosen.map((o, idx) => ({
      ...o,
      id: Date.now() + idx,
      date: "Just now",
    }));
    updateOrderList([...newOrders, ...orders]);
    setShowSampleOrderModal(false);
    setSelectedOrderTemplateIds([]);
    triggerToast(`Added ${newOrders.length} chosen orders to dashboard! 📋`);
  };

  const handleClearAllProducts = () => {
    if (confirm("Remove all products from your dashboard? You can choose or add them manually anytime.")) {
      updateProductList([]);
      triggerToast("All products removed.");
    }
  };

  const handleClearAllOrders = () => {
    if (confirm("Remove all orders from your dashboard?")) {
      updateOrderList([]);
      triggerToast("All orders removed.");
    }
  };

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem("obsidian_session");
    localStorage.removeItem("ownerName");
    localStorage.removeItem("shopName");
    localStorage.removeItem("businessType");
    router.push("/");
  };

  // Add or Edit Product Submit
  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPrice) {
      triggerToast("Please enter a valid product name and price");
      return;
    }

    const priceNum = parseFloat(formPrice);
    const stockNum = parseInt(formStock) || 0;

    if (editingProduct) {
      const updated = products.map((p) =>
        p.id === editingProduct.id
          ? {
            ...p,
            name: formName.trim(),
            price: priceNum,
            stock: stockNum,
            emoji: formEmoji || "📦",
            category: formCategory || "General",
            description: formDesc.trim(),
            status: "active",
          }
          : p
      );
      updateProductList(updated);
      triggerToast(`Updated "${formName.trim()}"`);
    } else {
      const newProd: Product = {
        id: Date.now(),
        name: formName.trim(),
        price: priceNum,
        stock: stockNum,
        emoji: formEmoji || "📦",
        category: formCategory || "General",
        description: formDesc.trim(),
        status: "active",
      };
      updateProductList([newProd, ...products]);
      triggerToast(`Added "${formName.trim()}" to catalog!`);
    }

    setShowProductModal(false);
    setEditingProduct(null);
    setFormName("");
    setFormPrice("");
    setFormStock("10");
    setFormEmoji("📦");
    setFormCategory("General");
    setFormDesc("");
  };

  const openAddProductModal = () => {
    setEditingProduct(null);
    setFormName("");
    setFormPrice("");
    setFormStock("10");
    setFormEmoji("✨");
    setFormCategory("Apparel");
    setFormDesc("");
    setShowProductModal(true);
  };

  const openEditProductModal = (product: Product) => {
    setEditingProduct(product);
    setFormName(product.name);
    setFormPrice(product.price.toString());
    setFormStock(product.stock.toString());
    setFormEmoji(product.emoji);
    setFormCategory(product.category);
    setFormDesc(product.description || "");
    setShowProductModal(true);
  };

  const handleDeleteProduct = (id: number, name: string) => {
    if (confirm(`Remove "${name}" from store catalog?`)) {
      const updated = products.filter((p) => p.id !== id);
      updateProductList(updated);
      triggerToast(`Deleted "${name}"`);
    }
  };

  // Adjust stock inline (+1 or -1)
  const adjustStock = (id: number, amount: number) => {
    const updated = products.map((p) => {
      if (p.id === id) {
        const nextStock = Math.max(0, p.stock + amount);
        return { ...p, stock: nextStock };
      }
      return p;
    });
    updateProductList(updated);
  };

  // Order Submission
  const handleOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderCustomer.trim() || !orderProductId) {
      triggerToast("Please choose a customer name and product");
      return;
    }

    const targetProduct = products.find((p) => p.id === Number(orderProductId));
    if (!targetProduct) {
      triggerToast("Selected product not found");
      return;
    }

    if (targetProduct.stock < orderQty) {
      triggerToast(`Only ${targetProduct.stock} units available in stock!`);
      return;
    }

    const finalPrice = targetProduct.price * orderQty;
    const newOrder: Order = {
      id: Date.now(),
      customerName: orderCustomer.trim(),
      productName: targetProduct.name,
      productId: targetProduct.id,
      quantity: orderQty,
      totalPrice: finalPrice,
      status: "completed",
      date: "Just now",
    };

    // Deduct stock
    const nextStock = targetProduct.stock - orderQty;
    const updatedProducts = products.map((p) =>
      p.id === targetProduct.id ? { ...p, stock: nextStock } : p
    );

    updateProductList(updatedProducts);
    updateOrderList([newOrder, ...orders]);
    setShowOrderModal(false);
    setOrderCustomer("");
    setOrderProductId("");
    setOrderQty(1);
    setOrderCalculatedPrice(0);
    triggerToast(`Order placed for ${orderCustomer.trim()} (${currency}${finalPrice.toLocaleString()})`);
  };

  const handleDeleteOrder = (id: number) => {
    if (confirm("Delete this order record?")) {
      const updated = orders.filter((o) => o.id !== id);
      updateOrderList(updated);
      triggerToast("Order record removed");
    }
  };

  const toggleOrderStatus = (id: number) => {
    let nextStatus: Order["status"] = "completed";
    const updated = orders.map((o) => {
      if (o.id === id) {
        nextStatus =
          o.status === "completed" ? "pending" : o.status === "pending" ? "processing" : "completed";
        return { ...o, status: nextStatus };
      }
      return o;
    });
    updateOrderList(updated);
    triggerToast("Order status updated");
  };

  // Copy Store Link (dynamic localhost/current domain)
  const copyStoreLink = () => {
    const storeSlug = shopName.toLowerCase().replace(/\s+/g, "-");
    const base = typeof window !== "undefined" && window.location.origin ? window.location.origin : "http://localhost:3000";
    const link = `${base}/store/${storeSlug}`;
    navigator.clipboard.writeText(link);
    triggerToast("Live store link copied to clipboard! 📋");
  };

  // Clear all user data
  const clearAllData = () => {
    if (confirm("Clear all products and orders? This cannot be undone.")) {
      updateProductList([]);
      updateOrderList([]);
      triggerToast("All data cleared");
    }
  };

  // Save Settings
  const saveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("ownerName", ownerName);
    localStorage.setItem("shopName", shopName);
    localStorage.setItem("businessType", businessType);
    localStorage.setItem("storeCurrency", currency);
    localStorage.setItem("currency", currency);
    triggerToast("Store settings saved successfully! ✅");
  };

  // Filtered Products
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(productSearch.toLowerCase())
  );

  // Filtered Orders
  const filteredOrders = orders.filter((o) => {
    if (orderFilter === "all") return true;
    return o.status === orderFilter;
  });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "OB";
  };

  if (authLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#080c14",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#94a3b8",
          fontFamily: "var(--font-inter, sans-serif)",
          fontSize: "0.95rem",
          letterSpacing: "0.05em",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "18px",
              height: "18px",
              borderRadius: "50%",
              border: "2px solid rgba(255, 255, 255, 0.2)",
              borderTopColor: "#fa709a",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <span>Verifying session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`dashboard-root ${activeTab === "overview" ? "db-theme-white" : ""}`}>
      {/* Ambient background blur circles */}
      <div className="db-ambient-glow db-ambient-1" />
      <div className="db-ambient-glow db-ambient-2" />

      {/* ── LEFT SIDEBAR ── */}
      <aside className="db-sidebar">
        <Link href="/dashboard" className="db-brand" data-cursor="link">
          <div className="db-brand-icon">O</div>
          <div className="db-brand-text">
            <span className="db-brand-title">OBSIDIAN</span>
            <span className="db-brand-tag">Architectural Storefront</span>
          </div>
        </Link>

        {/* Navigation items */}
        <nav className="db-nav">
          <span className="db-nav-label">Management</span>

          <button
            className={`db-nav-item ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
            data-cursor="link"
          >
            <span className="nav-icon">🏠</span>
            <span>Dashboard</span>
          </button>

          <button
            className={`db-nav-item ${activeTab === "products" ? "active" : ""}`}
            onClick={() => setActiveTab("products")}
            data-cursor="link"
          >
            <span className="nav-icon">📦</span>
            <span>Products</span>
            <span className="db-nav-badge">{totalProducts}</span>
          </button>

          <button
            className={`db-nav-item ${activeTab === "orders" ? "active" : ""}`}
            onClick={() => setActiveTab("orders")}
            data-cursor="link"
          >
            <span className="nav-icon">📋</span>
            <span>Orders</span>
            <span className="db-nav-badge">{totalOrdersCount}</span>
          </button>

          <button
            className="db-nav-item"
            onClick={() => setShowStorePreview(true)}
            data-cursor="link"
          >
            <span className="nav-icon">🛍️</span>
            <span>Live Store Preview</span>
          </button>

          <span className="db-nav-label" style={{ marginTop: 16 }}>Configuration</span>

          <button
            className={`db-nav-item ${activeTab === "settings" ? "active" : ""}`}
            onClick={() => setActiveTab("settings")}
            data-cursor="link"
          >
            <span className="nav-icon">⚙️</span>
            <span>Store Settings</span>
          </button>
        </nav>

        {/* Sidebar Footer */}
        <div className="db-sidebar-footer">
          <div className="db-store-status">
            <div className="db-status-dot" />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--nm-text-dark)" }}>Store Live</span>
              <span style={{ fontSize: "0.68rem", color: "var(--nm-text-muted)" }}>Synchronized</span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="db-logout-btn"
            data-cursor="link"
          >
            <span>🚪</span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT WORKSPACE ── */}
      <main className="db-main">
        {/* Top Header Bar */}
        <header className="db-topbar">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <h1 className="db-welcome-title">
                Welcome back, {ownerName} 👋
              </h1>
              {isGuestUser && (
                <span
                  style={{
                    background: "rgba(139, 92, 246, 0.18)",
                    border: "1px solid rgba(139, 92, 246, 0.4)",
                    color: "#c084fc",
                    padding: "3px 9px",
                    borderRadius: "999px",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                  }}
                  title={`User ID: ${userId}`}
                >
                  Guest Mode
                </span>
              )}
            </div>
            <p className="db-welcome-sub">
              Managing <strong style={{ color: "var(--nm-text-dark)" }}>{shopName}</strong> • {businessType.toUpperCase()}
              {isGuestUser && userId && <span style={{ opacity: 0.7 }}> • UID: {userId.slice(0, 8)}...</span>}
            </p>
          </div>

          <div className="db-topbar-actions">
            <button
              onClick={() => setShowStorePreview(true)}
              className="db-btn db-btn-secondary"
              data-cursor="link"
              title="Preview Customer Storefront"
            >
              🛍️ Store Preview
            </button>

            <button
              onClick={openAddProductModal}
              className="db-btn db-btn-primary"
              data-cursor="link"
            >
              <span>+</span>
              <span>Add Product</span>
            </button>

            {/* Profile Chip */}
            <div className="db-profile-chip">
              <div className="db-avatar">{getInitials(ownerName)}</div>
              <div className="db-profile-info">
                <span className="db-profile-name">{ownerName}</span>
                <span className="db-profile-role">{shopName}</span>
              </div>
            </div>
          </div>
        </header>

        {/* ── 4 KEY METRIC CARDS (Shown on non-overview tabs) ── */}
        {activeTab !== "overview" && (
          <section className="db-stats-grid">
            {/* Total Products */}
            <div className="db-stat-card" style={{ ["--card-accent" as string]: "#8b5cf6", ["--icon-bg" as string]: "rgba(139, 92, 246, 0.15)" }}>
              <div className="db-stat-header">
                <div className="db-stat-icon-wrap">📦</div>
                <span className="db-stat-badge badge-up">{totalStockCount} in stock</span>
              </div>
              <div className="db-stat-value">{totalProducts}</div>
              <div className="db-stat-label">Total Active Products</div>
            </div>

            {/* Total Orders */}
            <div className="db-stat-card" style={{ ["--card-accent" as string]: "#06b6d4", ["--icon-bg" as string]: "rgba(6, 182, 212, 0.15)" }}>
              <div className="db-stat-header">
                <div className="db-stat-icon-wrap">🛒</div>
                <span className="db-stat-badge badge-up">Live tracking</span>
              </div>
              <div className="db-stat-value">{totalOrdersCount}</div>
              <div className="db-stat-label">Total Customer Orders</div>
            </div>

            {/* Total Sales */}
            <div className="db-stat-card" style={{ ["--card-accent" as string]: "#10b981", ["--icon-bg" as string]: "rgba(16, 185, 129, 0.15)" }}>
              <div className="db-stat-header">
                <div className="db-stat-icon-wrap">💰</div>
                <span className="db-stat-badge badge-up">+18.4% this month</span>
              </div>
              <div className="db-stat-value">{currency}{totalRevenue.toLocaleString()}</div>
              <div className="db-stat-label">Total Gross Sales</div>
            </div>

            {/* Total Customers */}
            <div className="db-stat-card" style={{ ["--card-accent" as string]: "#ec4899", ["--icon-bg" as string]: "rgba(236, 72, 153, 0.15)" }}>
              <div className="db-stat-header">
                <div className="db-stat-icon-wrap">👥</div>
                <span className="db-stat-badge badge-neutral">100% Verified</span>
              </div>
              <div className="db-stat-value">{uniqueCustomers}</div>
              <div className="db-stat-label">Unique Buyers</div>
            </div>
          </section>
        )}

        {/* ── TAB: OVERVIEW — STITCH GLASSMORPHISM STORE MERCHANT DASHBOARD ── */}
        {activeTab === "overview" && (() => {
          const chartDataByTimeframe = {
            weekly: {
              labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
              volume: currency + (Math.round(totalRevenue * 0.72 || 88430)).toLocaleString(),
              sub: "gross volume this week",
              growth: "+24.8% growth",
              areaPath: "M 0,165 C 100,160 150,140 230,120 C 300,100 370,125 450,75 C 530,30 610,65 700,45 L 700,200 L 0,200 Z",
              strokePath: "M 0,165 C 100,160 150,140 230,120 C 300,100 370,125 450,75 C 530,30 610,65 700,45",
              points: [
                { cx: 450, cy: 75, color: "#c084fc", label: currency + "54,200" },
                { cx: 700, cy: 45, color: "#38bdf8", label: currency + "88,430" },
              ],
            },
            daily: {
              labels: ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00", "23:59"],
              volume: currency + (Math.round(totalRevenue * 0.18 || 14850)).toLocaleString(),
              sub: "gross volume today",
              growth: "+16.4% today",
              areaPath: "M 0,180 C 110,175 180,150 250,110 C 330,65 410,130 490,90 C 570,50 630,70 700,30 L 700,200 L 0,200 Z",
              strokePath: "M 0,180 C 110,175 180,150 250,110 C 330,65 410,130 490,90 C 570,50 630,70 700,30",
              points: [
                { cx: 250, cy: 110, color: "#c084fc", label: currency + "4,300" },
                { cx: 700, cy: 30, color: "#38bdf8", label: currency + "14,850" },
              ],
            },
            monthly: {
              labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
              volume: currency + (Math.round(totalRevenue * 2.4 || 342100)).toLocaleString(),
              sub: "gross volume this month",
              growth: "+31.2% this month",
              areaPath: "M 0,170 C 120,150 200,110 320,85 C 440,60 540,95 700,25 L 700,200 L 0,200 Z",
              strokePath: "M 0,170 C 120,150 200,110 320,85 C 440,60 540,95 700,25",
              points: [
                { cx: 320, cy: 85, color: "#c084fc", label: currency + "1,85,000" },
                { cx: 700, cy: 25, color: "#38bdf8", label: currency + "3,42,100" },
              ],
            },
            yearly: {
              labels: ["Q1 (Jan-Mar)", "Q2 (Apr-Jun)", "Q3 (Jul-Sep)", "Q4 (Oct-Dec)"],
              volume: currency + (Math.round(totalRevenue * 8.5 || 1285000)).toLocaleString(),
              sub: "gross volume this year",
              growth: "+48.6% vs last year",
              areaPath: "M 0,185 C 130,160 240,120 360,70 C 480,30 580,50 700,15 L 700,200 L 0,200 Z",
              strokePath: "M 0,185 C 130,160 240,120 360,70 C 480,30 580,50 700,15",
              points: [
                { cx: 360, cy: 70, color: "#c084fc", label: currency + "6,40,000" },
                { cx: 700, cy: 15, color: "#38bdf8", label: currency + "12,85,000" },
              ],
            },
          };

          const currentChart = chartDataByTimeframe[chartTimeframe];

          return (
            <div className="stitch-dashboard-container">
              {/* Atmospheric Background Glowing Spheres & Subtle Grid */}
              <div className="stitch-atmospheric-bg">
                <div className="stitch-orb stitch-orb-1" />
                <div className="stitch-orb stitch-orb-2" />
                <div className="stitch-orb stitch-orb-3" />
                <div className="stitch-orb stitch-orb-4" />
                <div className="stitch-grid-mesh" />
              </div>

              {/* Overview Section Header & Quick Bar */}
              <div className="stitch-header-row">
                <div>
                  <h2 className="stitch-title">
                    Store Performance & Analytics
                    <span className="stitch-title-dot" />
                  </h2>
                  <p className="stitch-subtitle">
                    Real-time sales trajectory, customer checkouts, and inventory activity.
                  </p>
                </div>
                <div className="stitch-header-actions">
                  <span className="stitch-time-tag">Updated: Just now</span>
                  <button
                    className="stitch-refresh-btn"
                    onClick={() => {
                      triggerToast("Storefront metrics refreshed! ✨");
                    }}
                    type="button"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </button>
                </div>
              </div>

              {/* ── 4 KEY METRIC CARDS (WHITE GLASS THEME) ── */}
              <section aria-label="Key Performance Indicators" className="stitch-metrics-grid">
                {/* Card 1: Total Sales */}
                <div className="stitch-metric-card group">
                  <div className="stitch-metric-orb" style={{ background: "rgba(124, 58, 237, 0.12)" }} />
                  <div className="stitch-metric-header">
                    <span className="stitch-metric-label">Total Sales</span>
                    <span className="stitch-icon-badge" style={{ background: "rgba(124, 58, 237, 0.12)", color: "#7c3aed", border: "1px solid rgba(124, 58, 237, 0.25)" }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </span>
                  </div>
                  <div className="stitch-metric-value">{currency}{totalRevenue.toLocaleString()}</div>
                  <div className="stitch-metric-trend" style={{ color: "#16a34a" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}>
                      <path d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                    <span>+12.5%</span>
                    <span style={{ color: "#64748b", fontWeight: 500, marginLeft: 6 }}>vs last month</span>
                  </div>
                </div>

                {/* Card 2: Total Orders */}
                <div className="stitch-metric-card group">
                  <div className="stitch-metric-orb" style={{ background: "rgba(245, 158, 11, 0.12)" }} />
                  <div className="stitch-metric-header">
                    <span className="stitch-metric-label">Total Orders</span>
                    <span className="stitch-icon-badge" style={{ background: "rgba(245, 158, 11, 0.12)", color: "#d97706", border: "1px solid rgba(245, 158, 11, 0.25)" }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    </span>
                  </div>
                  <div className="stitch-metric-value">{totalOrdersCount}</div>
                  <div className="stitch-metric-trend" style={{ color: "#16a34a" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}>
                      <path d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                    <span>+8.1%</span>
                    <span style={{ color: "#64748b", fontWeight: 500, marginLeft: 6 }}>vs last week</span>
                  </div>
                </div>

                {/* Card 3: Customers */}
                <div className="stitch-metric-card group">
                  <div className="stitch-metric-orb" style={{ background: "rgba(6, 182, 212, 0.12)" }} />
                  <div className="stitch-metric-header">
                    <span className="stitch-metric-label">Customers</span>
                    <span className="stitch-icon-badge" style={{ background: "rgba(6, 182, 212, 0.12)", color: "#0284c7", border: "1px solid rgba(6, 182, 212, 0.25)" }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </span>
                  </div>
                  <div className="stitch-metric-value">{uniqueCustomers}</div>
                  <div className="stitch-metric-trend" style={{ color: "#16a34a" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}>
                      <path d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                    <span>+14.2%</span>
                    <span style={{ color: "#64748b", fontWeight: 500, marginLeft: 6 }}>new buyers</span>
                  </div>
                </div>

                {/* Card 4: Total Products */}
                <div className="stitch-metric-card group">
                  <div className="stitch-metric-orb" style={{ background: "rgba(139, 92, 246, 0.12)" }} />
                  <div className="stitch-metric-header">
                    <span className="stitch-metric-label">Total Products</span>
                    <span className="stitch-icon-badge" style={{ background: "rgba(139, 92, 246, 0.12)", color: "#7c3aed", border: "1px solid rgba(139, 92, 246, 0.25)" }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </span>
                  </div>
                  <div className="stitch-metric-value">{totalProducts}</div>
                  <div className="stitch-metric-trend" style={{ color: "#7c3aed" }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", display: "inline-block", marginRight: 6, boxShadow: "0 0 6px rgba(16, 185, 129, 0.5)" }} />
                    <span style={{ color: "#334155", fontWeight: 700 }}>{totalStockCount} In Stock</span>
                    <span style={{ color: "#64748b", fontWeight: 500, marginLeft: 6 }}>
                      ({lowStockCount} low alert)
                    </span>
                  </div>
                </div>
              </section>

              {/* ── TWO-COLUMN SECTION (GRAPH & ORDERS ON LEFT, STORE LINK & ALERTS ON RIGHT) ── */}
              <div className="stitch-layout-grid">
                {/* ── LEFT COLUMN (WIDE) ── */}
                <div className="stitch-main-column">
                  {/* Sales Performance Graph Card */}
                  <div className="stitch-glass-panel stitch-graph-card" data-purpose="gross-sales-graph">
                    <div className="stitch-graph-header">
                      <div>
                        <div className="stitch-graph-title-row">
                          <h2 className="stitch-graph-title">Total Gross Sales</h2>
                          <span className="stitch-growth-pill">{currentChart.growth}</span>
                        </div>
                        <p style={{ fontSize: "0.78rem", color: "#64748b", marginTop: 2 }}>
                          Performance revenue trajectory across channels
                        </p>
                      </div>

                      {/* Timeframe Filter Tabs */}
                      <div className="stitch-time-tabs">
                        {(["daily", "weekly", "monthly", "yearly"] as const).map((tf) => (
                          <button
                            key={tf}
                            className={`stitch-time-btn ${chartTimeframe === tf ? "active" : ""}`}
                            onClick={() => setChartTimeframe(tf)}
                            type="button"
                          >
                            {tf.charAt(0).toUpperCase() + tf.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Gross Volume Metric Callout */}
                    <div className="stitch-volume-callout">
                      <span className="stitch-volume-num">{currentChart.volume}</span>
                      <span className="stitch-volume-sub">{currentChart.sub}</span>
                    </div>

                    {/* SVG Smooth Area Chart with White Theme Soft Gradient */}
                    <div className="stitch-chart-wrap">
                      <svg className="stitch-chart-svg" viewBox="0 0 700 200" preserveAspectRatio="none">
                        <defs>
                          {/* Soft pastel violet/indigo gradient fill under chart curve */}
                          <linearGradient id="salesWhiteGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.22" />
                            <stop offset="60%" stopColor="#6366f1" stopOpacity="0.06" />
                            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                          </linearGradient>

                          {/* Radiant stroke line gradient */}
                          <linearGradient id="neonLineGradient" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#6366f1" />
                            <stop offset="50%" stopColor="#8b5cf6" />
                            <stop offset="100%" stopColor="#06b6d4" />
                          </linearGradient>

                          {/* Filter for smooth stroke shadow */}
                          <filter id="stitchChartGlow" x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#7c3aed" floodOpacity="0.3" />
                          </filter>
                        </defs>

                        {/* Subtle Grid lines */}
                        <line x1="0" y1="40" x2="700" y2="40" stroke="rgba(0,0,0,0.05)" strokeDasharray="4 4" strokeWidth="1" />
                        <line x1="0" y1="90" x2="700" y2="90" stroke="rgba(0,0,0,0.05)" strokeDasharray="4 4" strokeWidth="1" />
                        <line x1="0" y1="140" x2="700" y2="140" stroke="rgba(0,0,0,0.05)" strokeDasharray="4 4" strokeWidth="1" />
                        <line x1="0" y1="190" x2="700" y2="190" stroke="rgba(0,0,0,0.08)" strokeWidth="1" />

                        {/* Area Fill with gradient */}
                        <path d={currentChart.areaPath} fill="url(#salesWhiteGradient)" />

                        {/* Glowing Stroke Line */}
                        <path
                          d={currentChart.strokePath}
                          fill="none"
                          stroke="url(#neonLineGradient)"
                          strokeWidth="3.2"
                          strokeLinecap="round"
                          filter="url(#stitchChartGlow)"
                        />

                        {/* Active points indicator */}
                        {currentChart.points.map((pt, idx) => (
                          <g key={idx}>
                            <circle
                              cx={pt.cx}
                              cy={pt.cy}
                              r="6"
                              fill={pt.color}
                              stroke="#ffffff"
                              strokeWidth="3"
                              style={{ filter: "drop-shadow(0 2px 5px rgba(0,0,0,0.18))" }}
                            />
                          </g>
                        ))}
                      </svg>

                      {/* Chart X-Axis Labels */}
                      <div className="stitch-xaxis-labels">
                        {currentChart.labels.map((lbl, idx) => (
                          <span key={idx}>{lbl}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* BEGIN: Recent Orders Card */}
                  <div className="stitch-glass-panel stitch-orders-card" data-purpose="recent-orders-table">
                    <div className="stitch-orders-header">
                      <div>
                        <h2 className="stitch-orders-title">Recent Orders</h2>
                        <p className="stitch-orders-sub">Real-time status of incoming merchant customer checkouts</p>
                      </div>

                      <div className="stitch-orders-actions">
                        <button
                          className="stitch-link-btn"
                          onClick={() => setActiveTab("orders")}
                          type="button"
                          title="View complete orders list"
                        >
                          View All Orders
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setShowSampleOrderModal(true)}
                          className="stitch-refresh-btn"
                          style={{ padding: "6px 12px", fontSize: "0.74rem" }}
                          type="button"
                          title="Choose sample orders manually"
                        >
                          ⚡ Choose Orders
                        </button>
                        <button
                          onClick={() => setShowOrderModal(true)}
                          className="stitch-copy-btn"
                          style={{ padding: "6px 14px", fontSize: "0.74rem" }}
                          type="button"
                        >
                          + Add Order
                        </button>
                      </div>
                    </div>

                    {/* Responsive Orders Table */}
                    <div className="stitch-table-wrapper">
                      {orders.length === 0 ? (
                        <div className="stitch-empty-card">
                          <div className="stitch-empty-icon">🛒</div>
                          <h3 className="stitch-empty-title">No Orders Recorded Yet</h3>
                          <p className="stitch-empty-desc">
                            Incoming orders will appear here in real-time. You can choose curated sample orders or manually record customer checkouts.
                          </p>
                          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
                            <button
                              onClick={() => setShowSampleOrderModal(true)}
                              className="stitch-copy-btn"
                              type="button"
                            >
                              ⚡ Choose Sample Orders
                            </button>
                            <button
                              onClick={() => setShowOrderModal(true)}
                              className="stitch-refresh-btn"
                              type="button"
                            >
                              ➕ Record Custom Order
                            </button>
                          </div>
                        </div>
                      ) : (
                        <table className="stitch-table">
                          <thead>
                            <tr>
                              <th scope="col">Order ID</th>
                              <th scope="col">Customer</th>
                              <th scope="col">Amount</th>
                              <th scope="col">Status</th>
                              <th scope="col">Date</th>
                              <th scope="col" style={{ textAlign: "right" }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {orders.slice(0, 5).map((order) => {
                              const badgeClass =
                                order.status === "completed"
                                  ? "stitch-badge-completed"
                                  : order.status === "processing"
                                  ? "stitch-badge-processing"
                                  : order.status === "pending"
                                  ? "stitch-badge-pending"
                                  : "stitch-badge-shipped";

                              const initial = (order.customerName || "Customer").charAt(0).toUpperCase();

                              return (
                                <tr key={order.id}>
                                  <td className="stitch-order-id">#{order.id}</td>
                                  <td>
                                    <div className="stitch-customer-cell">
                                      <div
                                        className="stitch-customer-avatar"
                                        style={{
                                          background:
                                            order.status === "completed"
                                              ? "linear-gradient(135deg, #059669, #10b981)"
                                              : order.status === "processing"
                                              ? "linear-gradient(135deg, #2563eb, #3b82f6)"
                                              : order.status === "pending"
                                              ? "linear-gradient(135deg, #d97706, #f59e0b)"
                                              : "linear-gradient(135deg, #7c3aed, #a855f7)",
                                        }}
                                      >
                                        {initial}
                                      </div>
                                      <div>
                                        <div style={{ fontWeight: 700, color: "#0f172a" }}>{order.customerName}</div>
                                        <div style={{ fontSize: "0.72rem", color: "#64748b" }}>{order.productName} × {order.quantity}</div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="stitch-order-amount">
                                    {currency}{order.totalPrice.toLocaleString()}
                                  </td>
                                  <td>
                                    <button
                                      className={`stitch-badge ${badgeClass}`}
                                      onClick={() => toggleOrderStatus(order.id)}
                                      title="Click to toggle status"
                                      type="button"
                                    >
                                      <span className="stitch-badge-dot" />
                                      <span>{order.status}</span>
                                    </button>
                                  </td>
                                  <td style={{ color: "#64748b", fontSize: "0.76rem" }}>{order.date}</td>
                                  <td style={{ textAlign: "right" }}>
                                    <button
                                      onClick={() => handleDeleteOrder(order.id)}
                                      style={{
                                        background: "none",
                                        border: "none",
                                        color: "#94a3b8",
                                        cursor: "pointer",
                                        padding: "4px 8px",
                                        borderRadius: "6px",
                                        transition: "color 0.15s",
                                      }}
                                      onMouseEnter={(e) => (e.currentTarget.style.color = "#e11d48")}
                                      onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
                                      title="Delete order"
                                      type="button"
                                    >
                                      🗑️
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── RIGHT COLUMN (NARROW: LINK OF STORE, LOW STOCK ALERT, OFFER CARD, QUICK ACTIONS) ── */}
                <div className="stitch-side-column">
                  {/* Sketched "Link of Store" Card */}
                  <div className="stitch-glass-panel stitch-side-card" data-purpose="link-of-store-card">
                    <div className="stitch-card-header">
                      <div className="stitch-card-title-wrap">
                        <span className="stitch-icon-badge" style={{ background: "rgba(124, 58, 237, 0.15)", color: "#c084fc", border: "1px solid rgba(168, 85, 247, 0.3)", padding: 7 }}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                        </span>
                        <h3 className="stitch-card-title">Link of Store</h3>
                      </div>
                      <span className="stitch-live-pill">
                        <span className="stitch-live-dot" />
                        Live
                      </span>
                    </div>

                    <p className="stitch-card-desc">
                      Share your storefront link across WhatsApp, Instagram, or SMS to drive sales.
                    </p>

                    {/* Store Link URL Box with Copy Button */}
                    <div className="stitch-link-box">
                      <span className="stitch-link-text">
                        {storefrontUrl || `http://localhost:3000/store/${shopName.toLowerCase().replace(/\s+/g, "-")}`}
                      </span>
                      <button className="stitch-copy-btn" onClick={copyStoreLink} type="button">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy
                      </button>
                    </div>

                    {/* Quick Share & QR Preview Links */}
                    <div className="stitch-link-footer">
                      <a
                        href={`/store/${shopName.toLowerCase().replace(/\s+/g, "-")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="stitch-link-btn"
                      >
                        Open storefront
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                      <button
                        className="stitch-link-btn"
                        style={{ color: "#94a3b8" }}
                        onClick={() => setShowQrModal(true)}
                        type="button"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                        </svg>
                        QR Code
                      </button>
                    </div>
                  </div>

                  {/* Sketched "Low Stock Alert" Card */}
                  <div className="stitch-glass-panel stitch-side-card" data-purpose="low-stock-alert-card">
                    <div className="stitch-card-header">
                      <div className="stitch-card-title-wrap">
                        <span className="stitch-icon-badge" style={{ background: "rgba(244, 63, 94, 0.15)", color: "#fb7185", border: "1px solid rgba(244, 63, 94, 0.3)", padding: 7 }}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </span>
                        <h3 className="stitch-card-title">Low Stock Alert</h3>
                      </div>
                      <span className="stitch-critical-pill">
                        {lowStockCount > 0 ? `${lowStockCount} Critical` : "All Good"}
                      </span>
                    </div>

                    <p className="stitch-card-desc">
                      These items are running out of inventory and might impact customer fulfillment.
                    </p>

                    {/* Low Stock Item List */}
                    <div className="stitch-stock-list">
                      {lowStockProducts.length === 0 ? (
                        <div style={{ padding: "20px 14px", textAlign: "center", background: "#f8fafc", borderRadius: 14, border: "1px dashed #cbd5e1" }}>
                          <span style={{ fontSize: "1.4rem", display: "block", marginBottom: 6 }}>✨</span>
                          <p style={{ fontSize: "0.82rem", color: "#0f172a", fontWeight: 700 }}>All catalog items are well stocked</p>
                          <p style={{ fontSize: "0.74rem", color: "#64748b", marginTop: 2 }}>No items are currently below 5 units.</p>
                        </div>
                      ) : (
                        lowStockProducts.slice(0, 3).map((item) => (
                          <div key={item.id} className="stitch-stock-item">
                            <div className="stitch-stock-left">
                              <div className="stitch-stock-thumb">{item.emoji || "📦"}</div>
                              <div>
                                <h4 className="stitch-stock-name">{item.name}</h4>
                                <span className="stitch-stock-meta">
                                  {item.category} • {currency}{item.price.toLocaleString()}
                                </span>
                              </div>
                            </div>
                            <div className="stitch-stock-right">
                              <span className="stitch-left-badge">Only {item.stock} left</span>
                              <button
                                className="stitch-restock-btn"
                                onClick={() => handleQuickRestock(item.id, item.name)}
                                type="button"
                              >
                                Restock (+10)
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Manage Inventory Action Button */}
                    <button
                      className="stitch-wide-btn"
                      onClick={() => setActiveTab("products")}
                      type="button"
                    >
                      Manage All Inventory ({products.length})
                    </button>
                  </div>

                  {/* Active Promotions / Festive Offer Campaign Card */}
                  <div className="stitch-offer-card" data-purpose="active-offer-card">
                    <div className="stitch-offer-decor" />
                    <div className="stitch-offer-top">
                      <span className="stitch-offer-tag">Offer Campaign</span>
                      <span className="stitch-offer-status">
                        <span className="stitch-title-dot" style={{ width: 6, height: 6 }} />
                        Active
                      </span>
                    </div>

                    <h4 className="stitch-offer-heading">Festive Season 20% Off</h4>
                    <p className="stitch-offer-sub">
                      Promo code{" "}
                      <span
                        className="stitch-promo-code"
                        onClick={() => {
                          navigator.clipboard.writeText("FESTIVE20");
                          triggerToast("Promo code FESTIVE20 copied! 🎟️");
                        }}
                        title="Click to copy promo code"
                      >
                        FESTIVE20
                      </span>{" "}
                      is driving 42% of this week&apos;s sales.
                    </p>

                    <div className="stitch-offer-footer">
                      <span style={{ fontSize: "0.74rem", color: "#e9d5ff", opacity: 0.9 }}>Ends in 3 days</span>
                      <button
                        className="stitch-offer-action-btn"
                        onClick={() => {
                          triggerToast("Promotion FESTIVE20 active • 20% storewide discount applied!");
                        }}
                        type="button"
                      >
                        Configure Offer
                      </button>
                    </div>
                  </div>

                  {/* Quick Store Actions Panel */}
                  <div className="stitch-glass-panel stitch-side-card">
                    <div className="stitch-card-header" style={{ marginBottom: 6 }}>
                      <div className="stitch-card-title-wrap">
                        <span style={{ fontSize: "1.1rem" }}>⚡</span>
                        <h3 className="stitch-card-title">Quick Actions</h3>
                      </div>
                    </div>

                    <div className="stitch-quick-grid">
                      <button
                        className="stitch-quick-btn"
                        onClick={openAddProductModal}
                        type="button"
                        style={{ border: "none", color: "inherit" }}
                      >
                        <div className="stitch-quick-icon" style={{ color: "#c084fc" }}>➕</div>
                        <div className="stitch-quick-text">
                          <strong>New Product</strong>
                          <p>Add custom item</p>
                        </div>
                      </button>

                      <button
                        className="stitch-quick-btn"
                        onClick={() => setShowSampleChooserModal(true)}
                        type="button"
                        style={{ border: "none", color: "inherit" }}
                      >
                        <div className="stitch-quick-icon" style={{ color: "#38bdf8" }}>✨</div>
                        <div className="stitch-quick-text">
                          <strong>Choose Catalog</strong>
                          <p>Curated templates</p>
                        </div>
                      </button>

                      <button
                        className="stitch-quick-btn"
                        onClick={() => setShowSampleOrderModal(true)}
                        type="button"
                        style={{ border: "none", color: "inherit" }}
                      >
                        <div className="stitch-quick-icon" style={{ color: "#fbbf24" }}>⚡</div>
                        <div className="stitch-quick-text">
                          <strong>Choose Orders</strong>
                          <p>Simulate sales</p>
                        </div>
                      </button>

                      <button
                        className="stitch-quick-btn"
                        onClick={() => setShowOrderModal(true)}
                        type="button"
                        style={{ border: "none", color: "inherit" }}
                      >
                        <div className="stitch-quick-icon" style={{ color: "#4ade80" }}>🛍️</div>
                        <div className="stitch-quick-text">
                          <strong>New Order</strong>
                          <p>Record a sale</p>
                        </div>
                      </button>

                      <button
                        className="stitch-quick-btn"
                        onClick={() => setShowStorePreview(true)}
                        type="button"
                        style={{ border: "none", color: "inherit" }}
                      >
                        <div className="stitch-quick-icon" style={{ color: "#f43f5e" }}>🏬</div>
                        <div className="stitch-quick-text">
                          <strong>Live Preview</strong>
                          <p>Customer view</p>
                        </div>
                      </button>

                      <button
                        className="stitch-quick-btn"
                        onClick={clearAllData}
                        type="button"
                        style={{ border: "none", color: "inherit" }}
                      >
                        <div className="stitch-quick-icon" style={{ color: "#94a3b8" }}>🗑️</div>
                        <div className="stitch-quick-text">
                          <strong>Clear Data</strong>
                          <p>Reset store</p>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── TAB: PRODUCTS ── */}
        {activeTab === "products" && (
          <div className="db-panel">
            <div className="db-panel-header" style={{ flexWrap: "wrap", gap: 16 }}>
              <div>
                <h2 className="db-panel-title">
                  <span>📦</span> Product Catalog ({products.length})
                </h2>
                <p className="db-panel-subtitle">Manage, search, adjust stock, and edit items</p>
              </div>

              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <input
                  type="text"
                  placeholder="Search products..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="db-form-input"
                  style={{ width: 220, padding: "8px 14px", fontSize: "0.85rem" }}
                />
                <button
                  onClick={() => setShowSampleChooserModal(true)}
                  className="db-btn db-btn-outline-accent"
                  data-cursor="link"
                  title="Choose sample products manually"
                >
                  ✨ Choose from Catalog
                </button>
                <button onClick={openAddProductModal} className="db-btn db-btn-primary" data-cursor="link">
                  + Add Product
                </button>
                {products.length > 0 && (
                  <button
                    onClick={handleClearAllProducts}
                    className="db-btn db-btn-danger"
                    data-cursor="link"
                    title="Remove all products"
                  >
                    🗑️ Clear All
                  </button>
                )}
              </div>
            </div>

            <div className="db-items-list" style={{ marginTop: 16 }}>
              {products.length === 0 ? (
                <div className="db-empty-catalog-card">
                  <div className="db-empty-catalog-icon">📦</div>
                  <h3 className="db-empty-catalog-title">Catalog is Empty</h3>
                  <p className="db-empty-catalog-desc">
                    All example items have been removed. Choose sample products manually from the catalog, or click below to add a custom product.
                  </p>
                  <div className="db-empty-catalog-actions">
                    <button
                      onClick={() => setShowSampleChooserModal(true)}
                      className="db-btn db-btn-primary"
                      data-cursor="link"
                    >
                      ✨ Choose Sample Products
                    </button>
                    <button
                      onClick={openAddProductModal}
                      className="db-btn db-btn-secondary"
                      data-cursor="link"
                    >
                      ➕ Add Custom Product
                    </button>
                  </div>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="db-empty-state">
                  <div className="db-empty-icon">🔍</div>
                  <p>No products match your search query.</p>
                </div>
              ) : (
                filteredProducts.map((product) => (
                  <div key={product.id} className="db-item-row">
                    <div className="db-item-main">
                      <div className="db-item-emoji">{product.emoji}</div>
                      <div className="db-item-details">
                        <h4>{product.name}</h4>
                        <div className="db-item-meta">
                          <span style={{ color: "var(--db-accent)" }}>{product.category}</span>
                          <span>•</span>
                          <span>{product.description || "No description"}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      {/* Stock Stepper */}
                      <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.04)", padding: "4px 8px", borderRadius: "8px" }}>
                        <button
                          className="db-icon-btn"
                          style={{ width: 24, height: 24, fontSize: "0.8rem" }}
                          onClick={() => adjustStock(product.id, -1)}
                          title="Decrease stock"
                          data-cursor="link"
                        >
                          -
                        </button>
                        <span style={{ fontSize: "0.82rem", fontWeight: 600, minWidth: 28, textAlign: "center" }}>
                          {product.stock}
                        </span>
                        <button
                          className="db-icon-btn"
                          style={{ width: 24, height: 24, fontSize: "0.8rem" }}
                          onClick={() => adjustStock(product.id, 1)}
                          title="Increase stock"
                          data-cursor="link"
                        >
                          +
                        </button>
                      </div>

                      <span className="db-item-price">
                        {currency}{product.price.toLocaleString()}
                      </span>

                      <div className="db-item-actions">
                        <button
                          className="db-icon-btn"
                          onClick={() => openEditProductModal(product)}
                          title="Edit product"
                          data-cursor="link"
                        >
                          ✏️
                        </button>
                        <button
                          className="db-icon-btn btn-delete"
                          onClick={() => handleDeleteProduct(product.id, product.name)}
                          title="Delete product"
                          data-cursor="link"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── TAB: ORDERS ── */}
        {activeTab === "orders" && (
          <div className="db-panel">
            <div className="db-panel-header" style={{ flexWrap: "wrap", gap: 16 }}>
              <div>
                <h2 className="db-panel-title">
                  <span>📋</span> Orders Management ({orders.length})
                </h2>
                <p className="db-panel-subtitle">Filter by fulfillment status and manage customer receipts</p>
              </div>

              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <select
                  value={orderFilter}
                  onChange={(e) => setOrderFilter(e.target.value)}
                  className="db-form-select"
                  style={{ width: 140, padding: "8px 12px", fontSize: "0.85rem" }}
                >
                  <option value="all">All Statuses</option>
                  <option value="completed">Completed</option>
                  <option value="processing">Processing</option>
                  <option value="pending">Pending</option>
                </select>

                <button
                  onClick={() => setShowSampleOrderModal(true)}
                  className="db-btn db-btn-outline-accent"
                  data-cursor="link"
                  title="Choose sample orders manually"
                >
                  ⚡ Choose Sample Orders
                </button>

                <button onClick={() => setShowOrderModal(true)} className="db-btn db-btn-primary" data-cursor="link">
                  + Create Order
                </button>

                {orders.length > 0 && (
                  <button
                    onClick={handleClearAllOrders}
                    className="db-btn db-btn-danger"
                    data-cursor="link"
                    title="Remove all orders"
                  >
                    🗑️ Clear All
                  </button>
                )}
              </div>
            </div>

            <div className="db-items-list" style={{ marginTop: 16 }}>
              {orders.length === 0 ? (
                <div className="db-empty-catalog-card">
                  <div className="db-empty-catalog-icon">🛒</div>
                  <h3 className="db-empty-catalog-title">No Orders Recorded</h3>
                  <p className="db-empty-catalog-desc">
                    All example orders have been removed. Choose sample orders manually to simulate sales or record a customer order.
                  </p>
                  <div className="db-empty-catalog-actions">
                    <button
                      onClick={() => setShowSampleOrderModal(true)}
                      className="db-btn db-btn-primary"
                      data-cursor="link"
                    >
                      ⚡ Choose Sample Orders
                    </button>
                    <button
                      onClick={() => setShowOrderModal(true)}
                      className="db-btn db-btn-secondary"
                      data-cursor="link"
                    >
                      ➕ Record Custom Order
                    </button>
                  </div>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="db-empty-state">
                  <div className="db-empty-icon">🧾</div>
                  <p>No orders found for the selected filter.</p>
                </div>
              ) : (
                filteredOrders.map((order) => (
                  <div key={order.id} className="db-item-row">
                    <div className="db-item-main">
                      <div className="db-item-emoji">📦</div>
                      <div className="db-item-details">
                        <h4>{order.customerName}</h4>
                        <div className="db-item-meta">
                          <span style={{ color: "var(--nm-text-dark)", fontWeight: 600 }}>{order.productName}</span>
                          <span>× {order.quantity} units</span>
                          <span>•</span>
                          <span>{order.date}</span>
                        </div>
                      </div>
                    </div>

                    <div className="db-item-actions">
                      <button
                        className={`order-status status-${order.status}`}
                        onClick={() => toggleOrderStatus(order.id)}
                        title="Click to toggle status"
                        style={{ cursor: "pointer", border: "none" }}
                        data-cursor="link"
                      >
                        {order.status}
                      </button>
                      <span className="db-item-price" style={{ color: "var(--nm-accent-green)", marginLeft: 10 }}>
                        {currency}{order.totalPrice.toLocaleString()}
                      </span>
                      <button
                        className="db-icon-btn btn-delete"
                        onClick={() => handleDeleteOrder(order.id)}
                        title="Delete order"
                        data-cursor="link"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── TAB: SETTINGS ── */}
        {activeTab === "settings" && (
          <div className="db-panel" style={{ maxWidth: 700 }}>
            <div className="db-panel-header">
              <div>
                <h2 className="db-panel-title">
                  <span>⚙️</span> Store Profile & Configuration
                </h2>
                <p className="db-panel-subtitle">Personalize your architectural presence</p>
              </div>
            </div>

            <form onSubmit={saveSettings} className="db-form" style={{ marginTop: 16 }}>
              <div className="db-form-group">
                <label>Store Owner Full Name</label>
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="db-form-input"
                  required
                />
              </div>

              <div className="db-form-group">
                <label>Shop / Brand Name</label>
                <input
                  type="text"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="db-form-input"
                  required
                />
              </div>

              <div className="db-form-row">
                <div className="db-form-group">
                  <label>Business Category</label>
                  <select
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    className="db-form-select"
                  >
                    <option value="clothing">Clothing & Apparel</option>
                    <option value="electronics">Electronics & Tech</option>
                    <option value="luxury">Luxury & Jewelry</option>
                    <option value="restaurant">Restaurant & Dining</option>
                    <option value="general">Art & Sculpture</option>
                  </select>
                </div>

                <div className="db-form-group">
                  <label>Store Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="db-form-select"
                  >
                    <option value="₹">₹ (INR - Rupee)</option>
                    <option value="$">$ (USD - Dollar)</option>
                    <option value="€">€ (EUR - Euro)</option>
                    <option value="£">£ (GBP - Pound)</option>
                  </select>
                </div>
              </div>

              <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
                <button type="submit" className="db-btn db-btn-primary" data-cursor="link">
                  💾 Save Store Settings
                </button>
                <button type="button" onClick={clearAllData} className="db-btn db-btn-danger" data-cursor="link">
                  🗑️ Clear All Data
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* ── MODAL: ADD / EDIT PRODUCT ── */}
      {showProductModal && (
        <div className="db-modal-backdrop" onClick={() => setShowProductModal(false)}>
          <div className="db-modal" onClick={(e) => e.stopPropagation()}>
            <div className="db-modal-header">
              <h3 className="db-modal-title">
                {editingProduct ? "Edit Product" : "Add New Product"}
              </h3>
              <button
                className="db-modal-close"
                onClick={() => setShowProductModal(false)}
                data-cursor="link"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleProductSubmit} className="db-form">
              <div className="db-form-group">
                <label>Product Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Obsidian Oversized Parka"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="db-form-input"
                  required
                />
              </div>

              <div className="db-form-row">
                <div className="db-form-group">
                  <label>Price ({currency}) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g. 1999"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="db-form-input"
                    required
                  />
                </div>

                <div className="db-form-group">
                  <label>Stock Quantity *</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 20"
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    className="db-form-input"
                    required
                  />
                </div>
              </div>

              <div className="db-form-row">
                <div className="db-form-group">
                  <label>Emoji / Icon</label>
                  <input
                    type="text"
                    maxLength={3}
                    placeholder="e.g. 🧥"
                    value={formEmoji}
                    onChange={(e) => setFormEmoji(e.target.value)}
                    className="db-form-input"
                  />
                </div>

                <div className="db-form-group">
                  <label>Category</label>
                  <input
                    type="text"
                    placeholder="e.g. Apparel, Luxury"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="db-form-input"
                  />
                </div>
              </div>

              <div className="db-form-group">
                <label>Product Description</label>
                <textarea
                  placeholder="Describe materials, sizing, and details..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="db-form-textarea"
                />
              </div>

              <div className="db-modal-footer">
                <button
                  type="button"
                  className="db-btn db-btn-secondary"
                  onClick={() => setShowProductModal(false)}
                  data-cursor="link"
                >
                  Cancel
                </button>
                <button type="submit" className="db-btn db-btn-primary" data-cursor="link">
                  {editingProduct ? "Save Changes" : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: ADD ORDER ── */}
      {showOrderModal && (
        <div className="db-modal-backdrop" onClick={() => setShowOrderModal(false)}>
          <div className="db-modal" onClick={(e) => e.stopPropagation()}>
            <div className="db-modal-header">
              <h3 className="db-modal-title">Record Customer Order</h3>
              <button
                className="db-modal-close"
                onClick={() => setShowOrderModal(false)}
                data-cursor="link"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleOrderSubmit} className="db-form">
              <div className="db-form-group">
                <label>Customer Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Maya Lin"
                  value={orderCustomer}
                  onChange={(e) => setOrderCustomer(e.target.value)}
                  className="db-form-input"
                  required
                />
              </div>

              <div className="db-form-group">
                <label>Select Item *</label>
                <select
                  value={orderProductId}
                  onChange={(e) => {
                    const pid = Number(e.target.value);
                    setOrderProductId(pid);
                    const prod = products.find((p) => p.id === pid);
                    if (prod) setOrderCalculatedPrice(prod.price * orderQty);
                  }}
                  className="db-form-select"
                  required
                >
                  <option value="">-- Choose from Catalog --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.emoji} {p.name} — {currency}{p.price.toLocaleString()} ({p.stock} available)
                    </option>
                  ))}
                </select>
              </div>

              <div className="db-form-row">
                <div className="db-form-group">
                  <label>Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    value={orderQty}
                    onChange={(e) => {
                      const qty = Math.max(1, parseInt(e.target.value) || 1);
                      setOrderQty(qty);
                      const prod = products.find((p) => p.id === Number(orderProductId));
                      if (prod) setOrderCalculatedPrice(prod.price * qty);
                    }}
                    className="db-form-input"
                    required
                  />
                </div>

                <div className="db-form-group">
                  <label>Total Price ({currency})</label>
                  <input
                    type="text"
                    value={`${currency}${orderCalculatedPrice.toLocaleString()}`}
                    readOnly
                    className="db-form-input"
                    style={{ color: "var(--nm-accent-green)", fontWeight: 800 }}
                  />
                </div>
              </div>

              <div className="db-modal-footer">
                <button
                  type="button"
                  className="db-btn db-btn-secondary"
                  onClick={() => setShowOrderModal(false)}
                  data-cursor="link"
                >
                  Cancel
                </button>
                <button type="submit" className="db-btn db-btn-primary" data-cursor="link">
                  Place Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: LIVE STORE PREVIEW ── */}
      {showStorePreview && (
        <div className="db-modal-backdrop" onClick={() => setShowStorePreview(false)}>
          <div className="db-modal db-storefront-modal" onClick={(e) => e.stopPropagation()}>
            <div className="db-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: "1.4rem" }}>🛍️</span>
                <h3 className="db-modal-title">Live Storefront Simulator</h3>
              </div>
              <button
                className="db-modal-close"
                onClick={() => setShowStorePreview(false)}
                data-cursor="link"
              >
                ✕
              </button>
            </div>

            <div className="store-preview-header">
              <div className="store-preview-logo">{shopName}</div>
              <p style={{ fontSize: "0.85rem", color: "var(--db-text-muted)", letterSpacing: "0.08em" }}>
                Curated by {ownerName} • OBSIDIAN Architecture
              </p>
            </div>

            <div className="store-preview-grid">
              {products.map((prod) => (
                <div key={prod.id} className="store-product-card">
                  <div className="store-product-emoji">{prod.emoji}</div>
                  <div className="store-product-name">{prod.name}</div>
                  <div className="store-product-price">
                    {currency}{prod.price.toLocaleString()}
                  </div>
                  <button
                    className="db-btn db-btn-outline-accent"
                    style={{ fontSize: "0.75rem", padding: "6px 10px" }}
                    onClick={() => {
                      triggerToast(`Simulated cart add: "${prod.name}"`);
                    }}
                    data-cursor="link"
                  >
                    + Add to Cart
                  </button>
                </div>
              ))}
            </div>

            <div className="db-modal-footer" style={{ justifyContent: "space-between", marginTop: 24, gap: 10, flexWrap: "wrap" }}>
              <button
                onClick={copyStoreLink}
                className="db-btn db-btn-secondary"
                data-cursor="link"
              >
                📋 Copy Store Link
              </button>
              <a
                href={`/store/${shopName.toLowerCase().replace(/\s+/g, "-")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="db-btn db-btn-secondary"
                data-cursor="link"
                style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }}
              >
                ↗️ Open Full Store
              </a>
              <button
                onClick={() => setShowStorePreview(false)}
                className="db-btn db-btn-primary"
                data-cursor="link"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: CHOOSE SAMPLE PRODUCTS MANUALLY ── */}
      {showSampleChooserModal && (
        <div className="db-modal-backdrop" onClick={() => setShowSampleChooserModal(false)}>
          <div className="db-modal db-sample-modal" onClick={(e) => e.stopPropagation()}>
            <div className="db-modal-header">
              <div>
                <h3 className="db-modal-title">✨ Choose Products from Catalog</h3>
                <p className="db-sample-header-desc">
                  Select which items you want to display on your dashboard. Choose manually then show them.
                </p>
              </div>
              <button
                className="db-modal-close"
                onClick={() => setShowSampleChooserModal(false)}
                data-cursor="link"
              >
                ✕
              </button>
            </div>

            <div className="db-sample-filter-row">
              <div className="db-sample-pills">
                {["all", "Apparel", "Home", "Accessories", "Stationery", "Tech"].map((cat) => (
                  <button
                    key={cat}
                    className={`db-sample-pill ${sampleCategoryFilter === cat ? "active" : ""}`}
                    onClick={() => setSampleCategoryFilter(cat)}
                    data-cursor="link"
                  >
                    {cat === "all" ? "All Categories" : cat}
                  </button>
                ))}
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  className="db-btn db-btn-secondary"
                  style={{ padding: "5px 12px", fontSize: "0.76rem" }}
                  onClick={selectAllTemplates}
                  data-cursor="link"
                >
                  Select All
                </button>
                {selectedTemplateIds.length > 0 && (
                  <button
                    type="button"
                    className="db-btn db-btn-secondary"
                    style={{ padding: "5px 12px", fontSize: "0.76rem" }}
                    onClick={deselectAllTemplates}
                    data-cursor="link"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div className="db-sample-grid">
              {SAMPLE_CATALOG_TEMPLATES.filter((item) => {
                if (sampleCategoryFilter === "all") return true;
                return item.category.toLowerCase() === sampleCategoryFilter.toLowerCase();
              }).map((template) => {
                const isSelected = selectedTemplateIds.includes(template.id);
                return (
                  <div
                    key={template.id}
                    className={`db-sample-card ${isSelected ? "selected" : ""}`}
                    onClick={() => toggleTemplateSelection(template.id)}
                    data-cursor="link"
                  >
                    <div className="db-sample-top">
                      <div className="db-sample-emoji">{template.emoji}</div>
                      <div className="db-sample-checkbox">
                        {isSelected ? "✓" : ""}
                      </div>
                    </div>

                    <div className="db-sample-name">{template.name}</div>
                    <div style={{ fontSize: "0.72rem", color: "var(--nm-accent)", fontWeight: 700, marginBottom: 4 }}>
                      {template.category} • {template.stock} in stock
                    </div>
                    <div className="db-sample-desc">{template.description}</div>

                    <div className="db-sample-footer">
                      <span className="db-sample-price">
                        {currency}{template.price.toLocaleString()}
                      </span>
                      <button
                        type="button"
                        className="db-sample-add-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddSingleTemplate(template);
                        }}
                        data-cursor="link"
                        title="Add only this item to dashboard"
                      >
                        + Add Now
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="db-modal-footer" style={{ justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--nm-text-medium)" }}>
                {selectedTemplateIds.length} item{selectedTemplateIds.length === 1 ? "" : "s"} selected
              </span>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="button"
                  className="db-btn db-btn-secondary"
                  onClick={() => setShowSampleChooserModal(false)}
                  data-cursor="link"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="db-btn db-btn-primary"
                  onClick={handleAddSelectedTemplates}
                  data-cursor="link"
                  disabled={selectedTemplateIds.length === 0}
                  style={{ opacity: selectedTemplateIds.length === 0 ? 0.6 : 1 }}
                >
                  Add & Show Selected ({selectedTemplateIds.length}) →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: CHOOSE SAMPLE ORDERS MANUALLY ── */}
      {showSampleOrderModal && (
        <div className="db-modal-backdrop" onClick={() => setShowSampleOrderModal(false)}>
          <div className="db-modal" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
            <div className="db-modal-header">
              <div>
                <h3 className="db-modal-title">⚡ Choose Sample Orders</h3>
                <p className="db-sample-header-desc">
                  Select customer transactions to show and test live statistics in your dashboard.
                </p>
              </div>
              <button
                className="db-modal-close"
                onClick={() => setShowSampleOrderModal(false)}
                data-cursor="link"
              >
                ✕
              </button>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
              <button
                type="button"
                className="db-btn db-btn-secondary"
                style={{ padding: "4px 12px", fontSize: "0.76rem" }}
                onClick={selectAllOrderTemplates}
                data-cursor="link"
              >
                Select All Orders
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: "50vh", overflowY: "auto" }}>
              {SAMPLE_ORDER_TEMPLATES.map((ord) => {
                const isSelected = selectedOrderTemplateIds.includes(ord.id);
                return (
                  <div
                    key={ord.id}
                    onClick={() => toggleOrderTemplateSelection(ord.id)}
                    className="db-item-row"
                    style={{
                      cursor: "pointer",
                      border: isSelected ? "2px solid var(--nm-accent)" : "2px solid transparent",
                      boxShadow: isSelected ? "var(--nm-shadow-in)" : "var(--nm-shadow-out)",
                    }}
                    data-cursor="link"
                  >
                    <div className="db-item-main">
                      <div className="db-sample-checkbox" style={{ marginRight: 8, flexShrink: 0 }}>
                        {isSelected ? "✓" : ""}
                      </div>
                      <div className="db-item-emoji">🛍️</div>
                      <div className="db-item-details">
                        <h4>{ord.customerName}</h4>
                        <div className="db-item-meta">
                          <span>{ord.productName} × {ord.quantity}</span>
                          <span>•</span>
                          <span>{ord.date}</span>
                        </div>
                      </div>
                    </div>

                    <div className="db-item-actions">
                      <span className={`order-status status-${ord.status}`}>
                        {ord.status}
                      </span>
                      <span className="db-item-price" style={{ color: "var(--nm-accent-green)", marginLeft: 8 }}>
                        {currency}{ord.totalPrice.toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="db-modal-footer" style={{ justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--nm-text-medium)" }}>
                {selectedOrderTemplateIds.length} order{selectedOrderTemplateIds.length === 1 ? "" : "s"} selected
              </span>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="button"
                  className="db-btn db-btn-secondary"
                  onClick={() => setShowSampleOrderModal(false)}
                  data-cursor="link"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="db-btn db-btn-primary"
                  onClick={handleAddSelectedOrders}
                  data-cursor="link"
                  disabled={selectedOrderTemplateIds.length === 0}
                  style={{ opacity: selectedOrderTemplateIds.length === 0 ? 0.6 : 1 }}
                >
                  Add & Show Orders ({selectedOrderTemplateIds.length}) →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── STOREFRONT QR CODE MODAL ── */}
      {showQrModal && (
        <div className="db-modal-overlay" onClick={() => setShowQrModal(false)}>
          <div className="db-modal stitch-qr-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="db-modal-header" style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: "1.4rem" }}>📱</span>
                <h3 className="db-modal-title" style={{ color: "#ffffff", fontSize: "1.1rem" }}>Storefront QR Code</h3>
              </div>
              <button
                className="db-modal-close"
                onClick={() => setShowQrModal(false)}
                style={{ background: "rgba(255,255,255,0.06)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                ✕
              </button>
            </div>

            <div style={{ textAlign: "center", padding: "24px 10px 10px" }}>
              <div
                style={{
                  width: 190,
                  height: 190,
                  margin: "0 auto 18px",
                  background: "#ffffff",
                  borderRadius: 16,
                  padding: 14,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
                }}
              >
                <svg width="160" height="160" viewBox="0 0 100 100" fill="none">
                  {/* Outer corner squares */}
                  <rect x="5" y="5" width="28" height="28" rx="4" fill="#000000" />
                  <rect x="11" y="11" width="16" height="16" rx="2" fill="#ffffff" />
                  <rect x="15" y="15" width="8" height="8" rx="1" fill="#000000" />

                  <rect x="67" y="5" width="28" height="28" rx="4" fill="#000000" />
                  <rect x="73" y="11" width="16" height="16" rx="2" fill="#ffffff" />
                  <rect x="77" y="15" width="8" height="8" rx="1" fill="#000000" />

                  <rect x="5" y="67" width="28" height="28" rx="4" fill="#000000" />
                  <rect x="11" y="73" width="16" height="16" rx="2" fill="#ffffff" />
                  <rect x="15" y="77" width="8" height="8" rx="1" fill="#000000" />

                  {/* QR Matrix Dots */}
                  <rect x="42" y="10" width="6" height="6" rx="1" fill="#000000" />
                  <rect x="52" y="15" width="6" height="6" rx="1" fill="#000000" />
                  <rect x="42" y="25" width="6" height="6" rx="1" fill="#000000" />
                  <rect x="10" y="42" width="6" height="6" rx="1" fill="#000000" />
                  <rect x="22" y="48" width="6" height="6" rx="1" fill="#000000" />
                  <rect x="40" y="40" width="8" height="8" rx="2" fill="#7c3aed" />
                  <rect x="52" y="48" width="6" height="6" rx="1" fill="#000000" />
                  <rect x="65" y="42" width="6" height="6" rx="1" fill="#000000" />
                  <rect x="78" y="48" width="6" height="6" rx="1" fill="#000000" />
                  <rect x="88" y="42" width="6" height="6" rx="1" fill="#000000" />
                  <rect x="42" y="65" width="6" height="6" rx="1" fill="#000000" />
                  <rect x="55" y="72" width="6" height="6" rx="1" fill="#000000" />
                  <rect x="72" y="65" width="6" height="6" rx="1" fill="#000000" />
                  <rect x="82" y="78" width="6" height="6" rx="1" fill="#000000" />
                  <rect x="62" y="85" width="6" height="6" rx="1" fill="#000000" />
                </svg>
              </div>

              <h4 style={{ color: "#0f172a", fontSize: "1.05rem", fontWeight: 800, marginBottom: 4 }}>
                Scan to Open {shopName}
              </h4>
              <p style={{ color: "#64748b", fontSize: "0.78rem", maxWidth: 300, margin: "0 auto 18px", wordBreak: "break-all" }}>
                {storefrontUrl || `http://localhost:3000/store/${shopName.toLowerCase().replace(/\s+/g, "-")}`}
              </p>

              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                <button
                  className="stitch-copy-btn"
                  onClick={copyStoreLink}
                  type="button"
                >
                  📋 Copy Store Link
                </button>
                <button
                  className="stitch-refresh-btn"
                  onClick={() => {
                    triggerToast("QR Code ready for customer scanning! 📷");
                    setShowQrModal(false);
                  }}
                  type="button"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TOAST NOTIFICATION ── */}
      <div className={`db-toast ${showToast ? "show" : ""}`}>
        <div className="db-toast-icon">✓</div>
        <span>{toastMessage}</span>
      </div>
    </div>
  );
}
