import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://eetgdmgyufeqcvlfuvrm.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_PvChf0r2aoiNtKl0GhhUzg_Iovf-5pj';
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, detectSessionInUrl: false },
});
