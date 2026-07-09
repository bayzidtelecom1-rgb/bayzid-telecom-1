import { createClient } from '@supabase/supabase-js';

// Supabase URL & Anon Key configuration
// In production, these should be supplied via Vite environment variables (.env)
// We default to standard sandbox URLs and key patterns provided by the user
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://rixphsoqcgcb6g4ai5zlky.supabase.co';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'sb_publishable_zA0banv0Ty7WqR2gwJy0Jg_fIbJVlAj';

export const isSupabaseConfigured = () => {
  return !!supabaseUrl && !!supabaseAnonKey && !supabaseUrl.includes('your-supabase-project');
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

// Helper to check database table connectivity
export async function checkSupabaseConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const { data, error } = await supabase.from('app_settings').select('telecom_name').limit(1);
    if (error) {
      return { success: false, message: error.message };
    }
    return { success: true, message: 'Connected successfully to Supabase!' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Unknown network error connecting to Supabase.' };
  }
}
