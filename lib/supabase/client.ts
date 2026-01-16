import { createBrowserClient } from "@supabase/ssr";

/**
 * Create a Supabase client for client-side operations
 * ใช้ใน Client Components เท่านั้น
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Export singleton instance
export const supabase = createClient();