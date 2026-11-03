import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export type AuthUser = {
  id: string;
  email: string | null;
  phone: string | null;
  name: string;
  avatarUrl: string | null;
  provider: string;
};

export function formatUser(session: { user: { id: string; email?: string | null; phone?: string | null; user_metadata?: Record<string, unknown> } } | null): AuthUser | null {
  if (!session?.user) return null;
  const meta = session.user.user_metadata ?? {};
  const name = String(meta.full_name ?? meta.name ?? meta.user_name ?? '');
  const avatarUrl = String(meta.avatar_url ?? meta.picture ?? '');
  const provider = String(meta.provider ?? 'email');
  return {
    id: session.user.id,
    email: session.user.email ?? null,
    phone: session.user.phone ?? null,
    name: name || session.user.email?.split('@')[0] || (session.user.phone ?? '使用者'),
    avatarUrl: avatarUrl || null,
    provider,
  };
}
