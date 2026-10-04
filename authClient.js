import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://ytymbqdjhcjdpdinrvqx.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_MY732PI-wkXk3SJ_FIFInA_chi4X3iU';
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, detectSessionInUrl: false },
});
