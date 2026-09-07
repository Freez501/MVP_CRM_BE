import { createClient } from "@supabase/supabase-js"

const supabaseUrl =
  (import.meta.env.VITE_SUPABASE_URL as string) || "https://athmksfqkifsxmvgdetd.supabase.co"
const supabaseAnonKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ||
  "sb_publishable_WbfUvYEtEiVAziKZd7tG9A_MG1W3uM4"

export const isSupabaseConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
)

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
