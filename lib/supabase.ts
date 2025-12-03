import { createClient } from '@supabase/supabase-js'

// Client-side Supabase client (safe to expose anon key - it's designed to be public)
// The anon key is protected by Row Level Security (RLS) policies
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set')
}

if (!supabaseAnonKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side Supabase client (uses service role key - NEVER expose this to client)
// This bypasses RLS and should only be used in API routes and server components
const adminUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!adminUrl) {
  throw new Error('SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL must be set for admin client')
}

if (!adminKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
}

export const supabaseAdmin = createClient(adminUrl, adminKey)
