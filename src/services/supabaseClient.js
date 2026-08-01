import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// null when env vars aren't set (e.g. local dev without .env.local) — callers
// fall back to localStorage-only mode, mirroring the old GAS_URL-empty behavior.
export const supabase = url && anonKey ? createClient(url, anonKey) : null;
