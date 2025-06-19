import React, { createContext, useContext, useEffect, useState } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '@pitara/supabase'

interface AuthContextType {
  session: Session | null
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('[AuthProvider] Initializing')
    
    // Get initial session with better error handling
    const fetchInitialSession = async () => {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('[AuthProvider] Error getting initial session:', error)
        } else {
          console.log('[AuthProvider] Initial session loaded:', initialSession ? 'Has session' : 'No session')
          if (initialSession?.user) {
            console.log('[AuthProvider] User ID:', initialSession.user.id)
          }
        }
        
        setSession(initialSession)
        setLoading(false)
      } catch (err) {
        console.error('[AuthProvider] Unexpected error during session fetch:', err)
        setLoading(false)
      }
    }

    fetchInitialSession()

    // Listen for auth changes with expanded event handling
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log('[AuthProvider] Auth state changed:', event, newSession ? 'Has session' : 'No session')
        
        if (event === 'SIGNED_IN') {
          console.log('[AuthProvider] User signed in:', newSession?.user?.id)
          setSession(newSession)
          setLoading(false)
        } else if (event === 'SIGNED_OUT') {
          console.log('[AuthProvider] User signed out')
          setSession(null)
          setLoading(false)
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('[AuthProvider] Token refreshed for user:', newSession?.user?.id)
          setSession(newSession)
        } else if (event === 'USER_UPDATED') {
          console.log('[AuthProvider] User data updated')
          setSession(newSession)
        } else if (event === 'PASSWORD_RECOVERY') {
          console.log('[AuthProvider] Password recovery event')
        } else if (event === 'INITIAL_SESSION') {
          // Don't update state here, we handle it separately above
          console.log('[AuthProvider] Initial session event')
        }
      }
    )

    return () => {
      console.log('[AuthProvider] Unsubscribing from auth changes')
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    console.log('[AuthProvider] Signing out')
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('[AuthProvider] Error signing out:', error)
      } else {
        console.log('[AuthProvider] Successfully signed out')
      }
    } catch (err) {
      console.error('[AuthProvider] Unexpected error during sign out:', err)
    }
  }

  const value = {
    session,
    user: session?.user ?? null,
    loading,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useSession() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useSession must be used within an AuthProvider')
  }
  return context
}

export const useAuth = useSession;

// Export all hooks except useSubscription to break the circular dependency
export { useSeriesData } from './useSeriesData';
export { usePlans } from './usePlans';
export { usePaymentMonitor } from './usePaymentMonitor';
export { useDownloads } from './useDownloads';
export { useNotifications } from './useNotifications'; 