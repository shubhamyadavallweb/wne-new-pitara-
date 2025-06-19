import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, Image, Alert } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Button } from 'react-native-paper'
import { makeRedirectUri } from 'expo-auth-session'
import * as Google from 'expo-auth-session/providers/google'
import { supabase } from '@pitara/supabase'
import { router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import Constants from 'expo-constants'

/**
 * Google और फ़ोन दोनों माध्यमों से साइन-इन की सुविधा वाला लॉगिन स्क्रीन।
 * Google बटन अब पूरी तरह कार्यात्मक है और OAuth प्रवाह को ट्रिगर करता है।
 */
export default function GoogleSignIn() {
  const [loading, setLoading] = useState(false)

  // Get client IDs from environment variables
  const {
    EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: webClientId,
    EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID: androidClientId,
    EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID: iosClientId,
  } = process.env

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId,
    iosClientId,
    webClientId,
    scopes: ['openid', 'profile', 'email'],
    responseType: 'id_token',
    redirectUri: makeRedirectUri({
      scheme: 'pitara',
      path: 'auth/callback',
    }),
  })

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params
      handleGoogleSignIn(id_token)
    } else if (response?.type === 'error') {
      Alert.alert('Authentication Error', response.error?.message || 'Failed to authenticate with Google')
    }
  }, [response])

  const handleGoogleSignIn = async (idToken: string) => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      })

      if (error) {
        console.error('Supabase auth error:', error)
        Alert.alert('Sign In Error', error.message)
        return
      }

      if (data.user) {
        router.replace('/(tabs)/home')
      }
    } catch (err) {
      console.error('Unexpected error during sign in:', err)
      Alert.alert('Error', 'An unexpected error occurred during sign in')
    } finally {
      setLoading(false)
    }
  }

  const startGoogleAuth = async () => {
    try {
      setLoading(true)
      if (!request) {
        Alert.alert('Error', 'Google Auth request not initialized')
        return
      }
      await promptAsync()
    } catch (error) {
      console.error('Error starting Google auth:', error)
      Alert.alert('Error', 'Failed to start Google authentication')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <StatusBar translucent backgroundColor="transparent" style="light" />
      <LinearGradient
        style={styles.container}
        colors={[ '#000000', '#1a0a20', '#000000' ]}
        locations={[0, 0.5, 1]}
      >
        <View style={styles.content}>
          {/* Logo */}
          <Image
            source={require('../../assets/Assets/pitaralogo.png')}
            style={styles.logo}
          />

          {/* Tagline */}
          <Text style={styles.tagline}>Welcome to your entertainment universe</Text>

          {/* Heading */}
          <Text style={styles.signInHeading}>Sign In</Text>
          <Text style={styles.subHeading}>Continue with Google</Text>

          {/* Google button */}
          <Button
            mode="contained"
            style={styles.googleButton}
            labelStyle={{ color: '#ffffff' }}
            onPress={startGoogleAuth}
            loading={loading}
            disabled={!request}
          >
            Continue with Google
          </Button>

          {/* Footer */}
          <Text style={styles.footerText}>
            By signing in, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
      </LinearGradient>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '100%',
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  logo: {
    width: 140,
    height: 140,
    resizeMode: 'contain',
    marginBottom: 32,
  },
  tagline: {
    fontSize: 16,
    color: '#d1d5db', // tailwind gray-300
    marginBottom: 40,
    textAlign: 'center',
  },
  signInHeading: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  subHeading: {
    fontSize: 14,
    color: '#d1d5db',
    marginBottom: 24,
    marginTop: 4,
  },
  googleButton: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#ff6b00', // orange
    borderRadius: 30,
    marginBottom: 32,
  },
  footerText: {
    fontSize: 12,
    color: '#a1a1aa',
    textAlign: 'center',
  },
}) 