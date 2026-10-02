import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from './config'

let client: SupabaseClient | null = null

/** Browser-only Supabase client (the app is a static export, no server runtime). */
export function supabase(): SupabaseClient {
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: 'kinfold.auth' },
    })
  }
  return client
}

/** Turn Supabase/Postgres errors into short, human sentences. */
export function friendlyError(err: unknown): string {
  const e = err as { message?: string; code?: string } | null
  const msg = e?.message || String(err ?? 'Something went wrong')
  if (/Invalid login credentials/i.test(msg)) return 'Email or password is incorrect.'
  if (/Email not confirmed/i.test(msg)) return 'Please confirm your email first — check your inbox for the link.'
  if (/User already registered/i.test(msg)) return 'An account with this email already exists. Try signing in.'
  if (/rate limit/i.test(msg)) return 'Too many attempts. Please wait a minute and try again.'
  if (/Password should be/i.test(msg)) return msg
  if (/duplicate key value.*budgets/i.test(msg)) return 'A budget for this category already exists.'
  if (/row-level security/i.test(msg)) return "You don't have permission to do that."
  if (/Failed to fetch|NetworkError|network/i.test(msg)) return 'No internet connection. Please try again.'
  if (/JWT|session/i.test(msg) && /expired|missing/i.test(msg)) return 'Your session expired. Please sign in again.'
  return msg.replace(/^ERROR:\s*/, '')
}
