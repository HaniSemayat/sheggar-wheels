/**
 * Sheggar Wheels - Server Supabase Client
 * Cookie-based session resolution for Server Components, Route Handlers, and Server Actions.
 */

import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function isSupabaseConfigured() {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes("your-project")
  );
}

/**
 * Creates a server-side Supabase client with Next.js cookie handling.
 * @param {object} cookieStore - result of `await cookies()` from `next/headers`
 */
export async function createServerSupabaseClient(cookieStore) {
  if (!isSupabaseConfigured()) {
    return null;
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing user sessions.
        }
      },
    },
  });
}

/**
 * Creates an administrative client with service-role privileges.
 * Strictly server-only; bypasses Row Level Security for maintenance/seed tasks.
 */
export function createAdminSupabaseClient() {
  if (!supabaseUrl || !supabaseServiceKey || supabaseUrl.includes("your-project")) {
    return null;
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
