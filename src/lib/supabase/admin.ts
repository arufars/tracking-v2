import { createClient } from "@supabase/supabase-js";

// Admin client dengan service role key - BYPASS RLS COMPLETELY
export function createSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase URL or Service Role Key");
  }

  // Quick safety check: warn if service key looks like the public anon key
  if (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY &&
    supabaseServiceKey === process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ) {
    console.warn(
      "[Supabase Admin] SUPABASE_SERVICE_ROLE_KEY is using the public anon key. ",
      "This will NOT bypass RLS. Please copy the service_role key from Supabase Settings > API.",
    );
  }

  // createClient with service_role key = FULL BYPASS of RLS
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
