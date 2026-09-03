import { User, Session } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";

/**
 * Returns the normalized redirect URL for authentication flows (e.g., password recovery, email verification).
 * Priority:
 * 1. NEXT_PUBLIC_SITE_URL or NEXT_PUBLIC_APP_URL environment variable
 * 2. NEXT_PUBLIC_VERCEL_URL (Vercel deployment environment)
 * 3. window.location.origin (current browser origin during local testing)
 * 4. Fallback to http://localhost:3000
 */
export function getAuthRedirectUrl(path: string = "/update-password"): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  // 1. Custom defined site / app url
  const customSiteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL;

  if (customSiteUrl && customSiteUrl.trim()) {
    const trimmed = customSiteUrl.trim().replace(/\/+$/, "");
    const withProtocol =
      trimmed.startsWith("http://") || trimmed.startsWith("https://")
        ? trimmed
        : `https://${trimmed}`;
    return `${withProtocol}${normalizedPath}`;
  }

  // 2. Vercel deployment variable
  if (process.env.NEXT_PUBLIC_VERCEL_URL && process.env.NEXT_PUBLIC_VERCEL_URL.trim()) {
    const trimmed = process.env.NEXT_PUBLIC_VERCEL_URL.trim().replace(/\/+$/, "");
    const withProtocol =
      trimmed.startsWith("http://") || trimmed.startsWith("https://")
        ? trimmed
        : `https://${trimmed}`;
    return `${withProtocol}${normalizedPath}`;
  }

  // 3. Browser runtime origin
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}${normalizedPath}`;
  }

  // 4. Default local fallback
  return `http://localhost:3000${normalizedPath}`;
}

/**
 * Sends a password reset email via Supabase Auth with configurable redirect URL.
 */
export async function sendPasswordResetEmail(
  email: string,
  customRedirectUrl?: string
): Promise<{ error: Error | null }> {
  try {
    const redirectTo = customRedirectUrl || getAuthRedirectUrl("/update-password");
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    });

    if (error) {
      return { error: new Error(error.message) };
    }
    return { error: null };
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : "Failed to send password reset email. Please try again.";
    return { error: new Error(message) };
  }
}

/**
 * Updates the authenticated user's password.
 */
export async function updateUserPassword(
  newPassword: string
): Promise<{ data: any; error: Error | null }> {
  try {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return { data: null, error: new Error(error.message) };
    }
    return { data, error: null };
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : "An unexpected error occurred while updating the password.";
    return { data: null, error: new Error(message) };
  }
}

/**
 * Checks if the current visitor already has an active authenticated session.
 */
export async function getExistingSession(): Promise<Session | null> {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.warn("Error fetching existing session:", error.message);
      return null;
    }
    return data.session;
  } catch (err) {
    console.error("Unexpected error retrieving session:", err);
    return null;
  }
}

/**
 * Helper to check if a Supabase user is anonymous
 */
export function isAnonymous(user: User | null | undefined): boolean {
  if (!user) return false;
  return Boolean(user.is_anonymous);
}

/**
 * Sign out current session
 */
export async function signOut(): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return { error: new Error(error.message) };
    }
    return { error: null };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred during sign out.";
    return { error: new Error(message) };
  }
}
