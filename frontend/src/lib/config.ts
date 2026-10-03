// Public runtime configuration. The Supabase publishable key is designed to be
// shipped to browsers and mobile apps; data is protected by Row Level Security
// (see supabase/migrations). Override any value with NEXT_PUBLIC_* env vars.

export const APP_NAME = 'ManaKhata'
export const APP_TAGLINE = "Your family's money, in one shared khata."

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lpqbtssvotkvogqmzohv.supabase.co'
export const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_BdkOH84Y2b2AJ70paZyaEg_FT1fuPLp'

/** Public web address used in email links (sign-up confirmation, password reset). */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://frontend-phi-lemon-1hkzt9uj98.vercel.app').replace(/\/$/, '')

export const SUPPORT_URL = 'https://github.com/iragavarapunagaatchutaneelima/ManaKhata/issues'
export const REPO_URL = 'https://github.com/iragavarapunagaatchutaneelima/ManaKhata'
export const LEGAL_UPDATED = '2 October 2026'
