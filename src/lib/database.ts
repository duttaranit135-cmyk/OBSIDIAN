import { supabase } from "./supabaseClient";

export interface DbUser {
  id: string;
  name: string | null;
  email: string | null;
  created_at?: string;
}

export interface DbStore {
  id: string;
  user_id: string;
  owner_name: string | null;
  shop_name: string | null;
  business_type: string | null;
  location: string | null;
  created_at?: string;
}

export interface DbProduct {
  id: number;
  user_id: string;
  name: string;
  price: number;
  stock: number;
  emoji: string;
  category: string;
  description: string;
  created_at?: string;
}

export interface DbOrder {
  id: number;
  user_id: string;
  customer_name: string;
  product_name: string;
  product_id: number | null;
  quantity: number;
  total_price: number;
  status: "completed" | "pending" | "processing";
  date: string;
  created_at?: string;
}

/* ==========================================================================
   1. USERS CRUD
   ========================================================================== */

/**
 * Get user by UUID
 */
export async function getUser(userId: string): Promise<{ data: DbUser | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) return { data: null, error: new Error(error.message) };
    return { data, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch user";
    return { data: null, error: new Error(message) };
  }
}

/**
 * Upsert user profile record
 */
export async function upsertUser(user: {
  id: string;
  name?: string;
  email?: string;
}): Promise<{ data: DbUser | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from("users")
      .upsert({
        id: user.id,
        name: user.name || "",
        email: user.email || "",
      }, { onConflict: "id" })
      .select()
      .maybeSingle();

    if (error) return { data: null, error: new Error(error.message) };
    return { data, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to upsert user";
    return { data: null, error: new Error(message) };
  }
}

/**
 * Update user profile
 */
export async function updateUser(
  userId: string,
  updates: Partial<Omit<DbUser, "id" | "created_at">>
): Promise<{ data: DbUser | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", userId)
      .select()
      .maybeSingle();

    if (error) return { data: null, error: new Error(error.message) };
    return { data, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update user";
    return { data: null, error: new Error(message) };
  }
}

/**
 * Delete user record
 */
export async function deleteUser(userId: string): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase.from("users").delete().eq("id", userId);
    if (error) return { error: new Error(error.message) };
    return { error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete user";
    return { error: new Error(message) };
  }
}

/* ==========================================================================
   2. STORES CRUD
   ========================================================================== */

/**
 * Get the latest store for a specific user
 */
export async function getLatestStore(userId: string): Promise<{ data: DbStore | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from("stores")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) return { data: null, error: new Error(error.message) };
    return { data, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch store";
    return { data: null, error: new Error(message) };
  }
}

/**
 * Get all stores belonging to a user
 */
export async function getStores(userId: string): Promise<{ data: DbStore[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from("stores")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) return { data: [], error: new Error(error.message) };
    return { data: data || [], error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch stores";
    return { data: [], error: new Error(message) };
  }
}

/**
 * Create a new store record
 */
export async function createStore(store: {
  user_id: string;
  owner_name?: string;
  shop_name?: string;
  business_type?: string;
  location?: string;
}): Promise<{ data: DbStore | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from("stores")
      .insert({
        user_id: store.user_id,
        owner_name: store.owner_name || "",
        shop_name: store.shop_name || "",
        business_type: store.business_type || "clothing",
        location: store.location || "",
      })
      .select()
      .single();

    if (error) return { data: null, error: new Error(error.message) };
    return { data, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create store";
    return { data: null, error: new Error(message) };
  }
}

/**
 * Update an existing store record
 */
export async function updateStore(
  storeId: string,
  updates: Partial<Omit<DbStore, "id" | "user_id" | "created_at">>
): Promise<{ data: DbStore | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from("stores")
      .update(updates)
      .eq("id", storeId)
      .select()
      .maybeSingle();

    if (error) return { data: null, error: new Error(error.message) };
    return { data, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update store";
    return { data: null, error: new Error(message) };
  }
}

/**
 * Delete a store
 */
export async function deleteStore(storeId: string): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase.from("stores").delete().eq("id", storeId);
    if (error) return { error: new Error(error.message) };
    return { error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete store";
    return { error: new Error(message) };
  }
}

/* ==========================================================================
   3. PRODUCTS CRUD
   ========================================================================== */

/**
 * Fetch all products for a specific user
 */
export async function getProducts(userId: string): Promise<{ data: DbProduct[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) return { data: [], error: new Error(error.message) };
    return { data: data || [], error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch products";
    return { data: [], error: new Error(message) };
  }
}

/**
 * Create a new product
 */
export async function createProduct(product: {
  user_id: string;
  name: string;
  price: number;
  stock: number;
  emoji?: string;
  category?: string;
  description?: string;
}): Promise<{ data: DbProduct | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from("products")
      .insert({
        user_id: product.user_id,
        name: product.name,
        price: product.price,
        stock: product.stock,
        emoji: product.emoji || "📦",
        category: product.category || "General",
        description: product.description || "",
      })
      .select()
      .single();

    if (error) return { data: null, error: new Error(error.message) };
    return { data, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create product";
    return { data: null, error: new Error(message) };
  }
}

/**
 * Update an existing product
 */
export async function updateProduct(
  productId: number,
  updates: Partial<Omit<DbProduct, "id" | "user_id" | "created_at">>
): Promise<{ data: DbProduct | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from("products")
      .update(updates)
      .eq("id", productId)
      .select()
      .maybeSingle();

    if (error) return { data: null, error: new Error(error.message) };
    return { data, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update product";
    return { data: null, error: new Error(message) };
  }
}

/**
 * Delete a product
 */
export async function deleteProduct(productId: number): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase.from("products").delete().eq("id", productId);
    if (error) return { error: new Error(error.message) };
    return { error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete product";
    return { error: new Error(message) };
  }
}

/* ==========================================================================
   4. ORDERS CRUD
   ========================================================================== */

/**
 * Fetch all orders for a specific user
 */
export async function getOrders(userId: string): Promise<{ data: DbOrder[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) return { data: [], error: new Error(error.message) };
    return { data: data || [], error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch orders";
    return { data: [], error: new Error(message) };
  }
}

/**
 * Create a new order
 */
export async function createOrder(order: {
  user_id: string;
  customer_name: string;
  product_name: string;
  product_id?: number | null;
  quantity: number;
  total_price: number;
  status?: "completed" | "pending" | "processing";
  date?: string;
}): Promise<{ data: DbOrder | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from("orders")
      .insert({
        user_id: order.user_id,
        customer_name: order.customer_name,
        product_name: order.product_name,
        product_id: order.product_id || null,
        quantity: order.quantity,
        total_price: order.total_price,
        status: order.status || "completed",
        date: order.date || new Date().toISOString().split("T")[0],
      })
      .select()
      .single();

    if (error) return { data: null, error: new Error(error.message) };
    return { data, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create order";
    return { data: null, error: new Error(message) };
  }
}

/**
 * Update order status
 */
export async function updateOrderStatus(
  orderId: number,
  status: "completed" | "pending" | "processing"
): Promise<{ data: DbOrder | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", orderId)
      .select()
      .maybeSingle();

    if (error) return { data: null, error: new Error(error.message) };
    return { data, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update order status";
    return { data: null, error: new Error(message) };
  }
}

/**
 * Delete an order
 */
export async function deleteOrder(orderId: number): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase.from("orders").delete().eq("id", orderId);
    if (error) return { error: new Error(error.message) };
    return { error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete order";
    return { error: new Error(message) };
  }
}
