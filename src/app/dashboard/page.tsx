"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import "./dashboard.css";

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  emoji: string;
  category: string;
  description: string;
}

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

  // Catalog & Orders
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

  // Auth guard state
  const [authLoading, setAuthLoading] = useState(true);

  // Authenticate session and listen for auth state changes
  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error || !session) {
          if (isMounted) {
            router.push("/");
          }
          return;
        }

        // If email exists and no custom owner name is set, provide fallback
        if (session.user?.email && !localStorage.getItem("ownerName")) {
          const defaultName = session.user.email.split("@")[0];
          setOwnerName(defaultName);
        }
      } catch (err) {
        console.error("Auth session check error:", err);
        if (isMounted) {
          router.push("/");
        }
      } finally {
        if (isMounted) {
          setAuthLoading(false);
        }
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        if (isMounted) {
          router.push("/");
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  // Load from localStorage on mount
  useEffect(() => {
    const storedOwner    = localStorage.getItem("ownerName")     || "Store Owner";
    const storedShop     = localStorage.getItem("shopName")      || "My Store";
    const storedType     = localStorage.getItem("businessType")  || "general";
    const storedCurrency = localStorage.getItem("storeCurrency") || "₹";

    setOwnerName(storedOwner);
    setShopName(storedShop);
    setBusinessType(storedType);
    setCurrency(storedCurrency);

    // Load only user-entered products (start empty if none)
    const storedProducts = localStorage.getItem("obsidian_products");
    if (storedProducts) {
      try { setProducts(JSON.parse(storedProducts)); } catch { /* ignore */ }
    }

    // Load only user-entered orders (start empty if none)
    const storedOrders = localStorage.getItem("obsidian_orders");
    if (storedOrders) {
      try { setOrders(JSON.parse(storedOrders)); } catch { /* ignore */ }
    }
  }, []);

  // Save changes helper
  const updateProductList = (newProducts: Product[]) => {
    setProducts(newProducts);
    localStorage.setItem("obsidian_products", JSON.stringify(newProducts));
  };

  const updateOrderList = (newOrders: Order[]) => {
    setOrders(newOrders);
    localStorage.setItem("obsidian_orders", JSON.stringify(newOrders));
  };

  // Dynamic Statistics
  const totalProducts = products.length;
  const totalStockCount = products.reduce((acc, p) => acc + p.stock, 0);
  const totalOrdersCount = orders.length;
  const totalRevenue = orders.reduce((acc, o) => acc + o.totalPrice, 0);
  const uniqueCustomers = new Set(orders.map((o) => o.customerName)).size;

  // Logout handler
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      // Clear authenticated state and storage
      localStorage.removeItem("ownerName");
      localStorage.removeItem("shopName");
      localStorage.removeItem("businessType");
      // Redirect to the login page
      router.push("/");
    }
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
    const updatedProducts = products.map((p) =>
      p.id === targetProduct.id ? { ...p, stock: p.stock - orderQty } : p
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
    const updated = orders.map((o) => {
      if (o.id === id) {
        const nextStatus: Order["status"] =
          o.status === "completed" ? "pending" : o.status === "pending" ? "processing" : "completed";
        return { ...o, status: nextStatus };
      }
      return o;
    });
    updateOrderList(updated);
    triggerToast("Order status updated");
  };

  // Copy Store Link
  const copyStoreLink = () => {
    const storeSlug = shopName.toLowerCase().replace(/\s+/g, "-");
    const link = `https://obsidian.studio/store/${storeSlug}`;
    navigator.clipboard.writeText(link);
    triggerToast("Store link copied to clipboard! 📋");
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
    <div className="dashboard-root">
      {/* Ambient background blur circles */}
      <div className="db-ambient-glow db-ambient-1" />
      <div className="db-ambient-glow db-ambient-2" />

      {/* ── LEFT SIDEBAR ── */}
      <aside className="db-sidebar">
        <Link href="/home" className="db-brand" data-cursor="link">
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

          <Link href="/page3" className="db-nav-item" data-cursor="link">
            <span className="nav-icon">✨</span>
            <span>Setup Wizard</span>
          </Link>

          <Link href="/home" className="db-nav-item" data-cursor="link">
            <span className="nav-icon">🏛️</span>
            <span>Landing Monument</span>
          </Link>
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
            <h1 className="db-welcome-title">
              Welcome back, {ownerName} 👋
            </h1>
            <p className="db-welcome-sub">
              Managing <strong style={{ color: "var(--nm-text-dark)" }}>{shopName}</strong> • {businessType.toUpperCase()}
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

        {/* ── 4 KEY METRIC CARDS ── */}
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

        {/* ── TAB: OVERVIEW ── */}
        {activeTab === "overview" && (
          <div className="db-grid">
            {/* Left Column: Products and Orders */}
            <div className="db-column">
              {/* Recent Products Card */}
              <div className="db-panel">
                <div className="db-panel-header">
                  <div>
                    <h2 className="db-panel-title">
                      <span>📦</span> Recent Products
                    </h2>
                    <p className="db-panel-subtitle">Manage store inventory items</p>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => setActiveTab("products")}
                      className="db-btn db-btn-secondary"
                      style={{ padding: "6px 12px", fontSize: "0.78rem" }}
                      data-cursor="link"
                    >
                      View All
                    </button>
                    <button
                      onClick={openAddProductModal}
                      className="db-btn db-btn-primary"
                      style={{ padding: "6px 12px", fontSize: "0.78rem" }}
                      data-cursor="link"
                    >
                      + Add
                    </button>
                  </div>
                </div>

                <div className="db-items-list">
                  {products.length === 0 ? (
                    <div className="db-empty-state">
                      <div className="db-empty-icon">📦</div>
                      <p>No products yet. Click "+ Add" to create your first item!</p>
                    </div>
                  ) : (
                    products.slice(0, 4).map((product) => (
                      <div key={product.id} className="db-item-row">
                        <div className="db-item-main">
                          <div className="db-item-emoji">{product.emoji}</div>
                          <div className="db-item-details">
                            <h4>{product.name}</h4>
                            <div className="db-item-meta">
                              <span>{product.category}</span>
                              <span
                                className={`db-stock-badge ${
                                  product.stock > 5 ? "stock-in" : product.stock > 0 ? "stock-low" : "stock-out"
                                }`}
                              >
                                {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="db-item-actions">
                          <span className="db-item-price">
                            {currency}{product.price.toLocaleString()}
                          </span>
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
                    ))
                  )}
                </div>
              </div>

              {/* Recent Orders Card */}
              <div className="db-panel">
                <div className="db-panel-header">
                  <div>
                    <h2 className="db-panel-title">
                      <span>🛒</span> Recent Orders
                    </h2>
                    <p className="db-panel-subtitle">Live storefront transactions</p>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => setActiveTab("orders")}
                      className="db-btn db-btn-secondary"
                      style={{ padding: "6px 12px", fontSize: "0.78rem" }}
                      data-cursor="link"
                    >
                      View All
                    </button>
                    <button
                      onClick={() => setShowOrderModal(true)}
                      className="db-btn db-btn-primary"
                      style={{ padding: "6px 12px", fontSize: "0.78rem" }}
                      data-cursor="link"
                    >
                      + Add Order
                    </button>
                  </div>
                </div>

                <div className="db-items-list">
                  {orders.length === 0 ? (
                    <div className="db-empty-state">
                      <div className="db-empty-icon">🛒</div>
                      <p>No orders yet. Add a customer order or test storefront simulation!</p>
                    </div>
                  ) : (
                    orders.slice(0, 4).map((order) => (
                      <div key={order.id} className="db-item-row">
                        <div className="db-item-main">
                          <div className="db-item-emoji">🛍️</div>
                          <div className="db-item-details">
                            <h4>{order.customerName}</h4>
                            <div className="db-item-meta">
                              <span>{order.productName} × {order.quantity}</span>
                              <span>•</span>
                              <span>{order.date}</span>
                            </div>
                          </div>
                        </div>

                        <div className="db-item-actions">
                          <button
                            className={`order-status status-${order.status}`}
                            onClick={() => toggleOrderStatus(order.id)}
                            title="Click to toggle order status"
                            style={{ background: "none", border: "none", cursor: "pointer" }}
                            data-cursor="link"
                          >
                            {order.status}
                          </button>
                          <span className="db-item-price" style={{ color: "var(--nm-accent-green)", marginLeft: 8 }}>
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
            </div>

            {/* Right Column: Store Link & Quick Actions */}
            <div className="db-column">
              {/* Storefront Share Card */}
              <div className="db-panel">
                <div className="db-panel-header">
                  <h2 className="db-panel-title">
                    <span>🔗</span> Live Storefront Link
                  </h2>
                </div>
                <p style={{ fontSize: "0.84rem", color: "var(--db-text-muted)" }}>
                  Share your customized architectural store link with customers worldwide.
                </p>

                <div className="db-share-box">
                  <span className="db-share-url">
                    https://obsidian.studio/store/{shopName.toLowerCase().replace(/\s+/g, "-")}
                  </span>
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    onClick={copyStoreLink}
                    className="db-btn db-btn-primary"
                    style={{ flex: 1 }}
                    data-cursor="link"
                  >
                    📋 Copy Store Link
                  </button>
                  <button
                    onClick={() => setShowStorePreview(true)}
                    className="db-btn db-btn-secondary"
                    data-cursor="link"
                    title="Open live store preview"
                  >
                    👁️ Preview
                  </button>
                </div>
              </div>

              {/* Quick Actions Card */}
              <div className="db-panel">
                <div className="db-panel-header">
                  <h2 className="db-panel-title">
                    <span>⚡</span> Quick Actions
                  </h2>
                </div>

                <div className="db-quick-actions">
                  <div className="db-action-card" onClick={openAddProductModal} data-cursor="link">
                    <div className="db-action-icon">➕</div>
                    <div className="db-action-info">
                      <strong>New Product</strong>
                      <p>Add to catalog</p>
                    </div>
                  </div>

                  <div className="db-action-card" onClick={() => setShowOrderModal(true)} data-cursor="link">
                    <div className="db-action-icon">🛍️</div>
                    <div className="db-action-info">
                      <strong>New Order</strong>
                      <p>Record a sale</p>
                    </div>
                  </div>

                  <div className="db-action-card" onClick={() => setShowStorePreview(true)} data-cursor="link">
                    <div className="db-action-icon">🏬</div>
                    <div className="db-action-info">
                      <strong>Live Store</strong>
                      <p>Customer view</p>
                    </div>
                  </div>

                  <div className="db-action-card" onClick={clearAllData} data-cursor="link">
                    <div className="db-action-icon">🗑️</div>
                    <div className="db-action-info">
                      <strong>Clear Data</strong>
                      <p>Remove all items</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Platform Info Card */}
              <div className="db-panel" style={{ background: "var(--nm-bg)" }}>
                <div className="db-panel-header">
                  <h2 className="db-panel-title" style={{ fontFamily: "var(--font-cormorant), Georgia, serif", fontSize: "1.35rem", color: "var(--nm-accent)" }}>
                    OBSIDIAN CLOUD
                  </h2>
                  <span style={{ fontSize: "0.7rem", color: "var(--nm-accent-green)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.1em", background: "var(--nm-bg)", padding: "3px 10px", borderRadius: "999px", boxShadow: "var(--nm-shadow-in)" }}>
                    v2.4 Active
                  </span>
                </div>
                <p style={{ fontSize: "0.82rem", color: "var(--nm-text-muted)", lineHeight: 1.6 }}>
                  Your digital monument storefront is accelerated with global edge CDN caching and Three.js 3D rendering engine.
                </p>
                <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
                  <Link href="/home" className="db-btn db-btn-secondary" style={{ flex: 1, fontSize: "0.8rem" }} data-cursor="link">
                    Explore Monument
                  </Link>
                  <Link href="/page3" className="db-btn db-btn-outline-accent" style={{ flex: 1, fontSize: "0.8rem" }} data-cursor="link">
                    Re-run Setup
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

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

              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <input
                  type="text"
                  placeholder="Search products by title or category..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="db-form-input"
                  style={{ width: 280, padding: "8px 14px", fontSize: "0.85rem" }}
                />
                <button onClick={openAddProductModal} className="db-btn db-btn-primary" data-cursor="link">
                  + Add Product
                </button>
              </div>
            </div>

            <div className="db-items-list" style={{ marginTop: 16 }}>
              {filteredProducts.length === 0 ? (
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

              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <select
                  value={orderFilter}
                  onChange={(e) => setOrderFilter(e.target.value)}
                  className="db-form-select"
                  style={{ width: 160, padding: "8px 12px", fontSize: "0.85rem" }}
                >
                  <option value="all">All Statuses</option>
                  <option value="completed">Completed</option>
                  <option value="processing">Processing</option>
                  <option value="pending">Pending</option>
                </select>

                <button onClick={() => setShowOrderModal(true)} className="db-btn db-btn-primary" data-cursor="link">
                  + Create Order
                </button>
              </div>
            </div>

            <div className="db-items-list" style={{ marginTop: 16 }}>
              {filteredOrders.length === 0 ? (
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
                          <span style={{ color: "#fff", fontWeight: 600 }}>{order.productName}</span>
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

            <div className="db-modal-footer" style={{ justifyContent: "space-between", marginTop: 24 }}>
              <button
                onClick={copyStoreLink}
                className="db-btn db-btn-secondary"
                data-cursor="link"
              >
                📋 Copy Store Link
              </button>
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

      {/* ── TOAST NOTIFICATION ── */}
      <div className={`db-toast ${showToast ? "show" : ""}`}>
        <div className="db-toast-icon">✓</div>
        <span>{toastMessage}</span>
      </div>
    </div>
  );
}
