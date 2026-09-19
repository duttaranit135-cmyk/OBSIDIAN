/**
 * OBSIDIAN API Client
 * Configured for https://obsidian-backend-1.onrender.com
 */

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://obsidian-backend-1.onrender.com";

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // If endpoint begins with /api, we can either use relative path (proxied by next.config rewrites)
  // or direct to the Render backend URL.
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${path}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const errorBody = await res.text();
    let parsed: any;
    try {
      parsed = JSON.parse(errorBody);
    } catch {
      parsed = { message: errorBody };
    }
    throw new Error(parsed.message || `API error (${res.status})`);
  }

  return res.json() as Promise<T>;
}

export const api = {
  // Health check
  getHealth: () => apiRequest("/health"),

  // Public storefront templates
  getTemplates: () => apiRequest("/api/templates"),

  // Public storefront data by store slug
  getPublicStore: (slug: string) => apiRequest(`/api/public/store/${encodeURIComponent(slug)}`),

  // Orders
  createOrder: (storeId: string, orderData: any) =>
    apiRequest(`/api/stores/${storeId}/orders`, {
      method: "POST",
      body: JSON.stringify(orderData),
    }),

  // Stores
  getUserStores: (token?: string) =>
    apiRequest("/api/stores/me", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }),

  createStore: (storeData: any, token?: string) =>
    apiRequest("/api/stores", {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify(storeData),
    }),
};
