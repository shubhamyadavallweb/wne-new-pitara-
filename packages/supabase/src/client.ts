import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Constants from 'expo-constants'

// 1. Try to read compile-time env variables (replaced by Metro when they exist)
let supabaseUrl: string | undefined = process.env.EXPO_PUBLIC_SUPABASE_URL
let supabaseAnonKey: string | undefined = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

// 2. When running in Expo, `process.env` may not be available at runtime.
//    Fall back to reading from `expo-constants` (values come from the `extra` field of app.json / app.config.js).
if (!supabaseUrl || !supabaseAnonKey) {
  const extra = (Constants?.expoConfig ?? Constants?.manifest)?.extra as Record<string, string> | undefined
  if (extra) {
    supabaseUrl = supabaseUrl || extra.EXPO_PUBLIC_SUPABASE_URL || extra.SUPABASE_URL
    supabaseAnonKey = supabaseAnonKey || extra.EXPO_PUBLIC_SUPABASE_ANON_KEY || extra.SUPABASE_SERVICE_ROLE_KEY
  }
}

// Additional fallback: try service role env var (useful during development). REMOVE for production
if (!supabaseAnonKey) {
  supabaseAnonKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey
}

const SUPABASE_URL = supabaseUrl ?? ''
const SUPABASE_ANON_KEY = supabaseAnonKey ?? ''

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing Supabase environment variables.\n' +
      'Make sure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are defined in your .env file (or in app.json under "extra").'
  )
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // Use react-native AsyncStorage for persisting the auth session on device
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

export default supabase 