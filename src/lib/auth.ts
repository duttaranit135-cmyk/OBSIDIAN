import { User, Session } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";

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
