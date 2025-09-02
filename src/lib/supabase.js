import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env';

// Create and export a single supabase client for use throughout the app
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);