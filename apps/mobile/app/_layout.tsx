import React, { useEffect, useState } from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
import { AuthProvider } from '@pitara/hooks'
import { useFonts } from 'expo-font'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { useNotifications } from '@pitara/hooks/src/useNotifications'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { Session } from '@supabase/supabase-js'
import { PaperProvider } from 'react-native-paper'
import { supabase } from '@pitara/supabase'
import { MD3DarkTheme as DefaultTheme } from 'react-native-paper'
import AsyncStorage from '@react-native-async-storage/async-storage'

SplashScreen.preventAutoHideAsync()

// Session context for auth state
type AuthContextType = {
  session: Session | null
  loading: boolean
}

export const AuthContext = React.createContext<AuthContextType>({
  session: null,
  loading: true,
})

// Global dark theme configuration
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#ff6b00',
    secondary: '#f9a826',
    // Ensure no surface/background is left light
    background: '#000000',
    surface: '#000000',
  },
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    // Add your custom fonts here
  })

  const { requestPermissions, isRegistered } = useNotifications()
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const segments = useSegments()
  const router = useRouter()
  const [initializing, setInitializing] = useState(true)

  // Development auth bypass disabled to enforce login on every app launch
  const isDevBypass = false

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync()
    }
    // Initialize notifications on app start
    requestPermissions()
    
    // Function to check auth state
    const checkAndSetSession = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        console.log("Initial session check:", currentSession ? "Logged in" : "No session");
        if (currentSession?.access_token) {
          console.log("Valid session found with user:", currentSession.user.id);
        }
        setSession(currentSession);
        setLoading(false);
      } catch (err) {
        console.error("Error checking session:", err);
        setLoading(false);
      }
    };
    
    // Initial session check
    checkAndSetSession();

    // Listen for auth state changes with improved logging
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log("Auth state changed:", event, newSession ? "Has session" : "No session");
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          console.log(`Auth event '${event}' detected, updating session state`);
          setSession(newSession);
          setLoading(false);
        } else if (event === 'INITIAL_SESSION') {
          console.log("Initial session event, current session:", newSession ? "Present" : "None");
          if (!newSession && !loading) {
            console.log("No initial session found");
          }
        } else {
          console.log(`Other auth event: ${event}`);
        }
      }
    )

    return () => {
      console.log("Cleaning up auth subscription")
      subscription.unsubscribe()
    }
  }, [loaded, error])

  useEffect(() => {
    // Check for stored tokens in AsyncStorage as a backup
    const checkStoredTokens = async () => {
      try {
        const storedTokens = await AsyncStorage.getItem('pitara-auth-token');
        if (storedTokens) {
          console.log('Found stored tokens in AsyncStorage (root layout)');
          
          // Allow navigation to continue regardless of token validity
          // The tabs layout will try to restore the session
          setInitializing(false);
        } else {
          console.log('No stored tokens found, checking Supabase session');
          
          // Check if we have a session with Supabase
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session) {
            console.log('Supabase session exists');
            setInitializing(false);
          } else {
            console.log('No session detected, redirecting to main login screen');
            setInitializing(false);
          }
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        setInitializing(false);
      }
    };
    
    checkStoredTokens();
  }, []);

  // Handle routing based on auth state
  useEffect(() => {
    if (loading || segments.length === 0) {
      // Avoid navigation until we have session state and segments initialized
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';
    
    console.log("Navigation state check:", { 
      hasSession: !!session, 
      inAuthGroup, 
      segments: segments.join('/'),
      currentLocation: segments.join('/'),
      isDevBypass,
      loading
    });
    
    // If authentication is required (production) and user is not logged in
    if (!session && !inAuthGroup && !isDevBypass) {
      console.log("No session detected, redirecting to main login screen");
      router.replace('/(auth)/google');
    } else if (session && inAuthGroup) {
      // If authenticated and in auth group, redirect to app
      console.log("Session active but in auth group, redirecting to main app");
      router.replace('/(tabs)');
    } else if (!session && inAuthGroup && isDevBypass) {
      // Development bypass: allow navigating away from auth screens without session
      console.log("DEV BYPASS: Allowing navigation without auth");
      router.replace('/(tabs)/home');
    } else if (session && !inAuthGroup) {
      console.log("Session active and in app, no redirect needed");
    }
  }, [session, loading, segments])

  if (!loaded && !error) {
    return null
  }

  if (initializing) {
    // You could render a loading screen here
    return null;
  }

  return (
    <AuthContext.Provider value={{ session, loading }}>
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor="#000" translucent={false} />
        <PaperProvider theme={theme}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <AuthProvider>
              <Stack
                screenOptions={{
                  headerStyle: {
                    backgroundColor: '#000',
                  },
                  headerTintColor: '#fff',
                  headerTitleStyle: {
                    fontWeight: 'bold',
                  },
                }}
              >
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="series/[id]" options={{ headerShown: false }} />
                <Stack.Screen name="subscription" options={{ 
                  title: 'Subscribe to Pitara',
                  presentation: 'modal'
                }} />
                <Stack.Screen name="purchase-history" options={{ headerShown: true, headerTitle: 'Purchase History' }} />
              </Stack>
            </AuthProvider>
          </GestureHandlerRootView>
        </PaperProvider>
      </SafeAreaProvider>
    </AuthContext.Provider>
  )
} 