import React from 'react'
import { Stack } from 'expo-router'
import { useTheme } from 'react-native-paper'

export default function AuthLayout() {
  const theme = useTheme()
  
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#000',
        },
        headerTintColor: '#fff',
      }}
    >
      <Stack.Screen
        name="google"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="phone"
        options={{
          title: 'Phone Sign In',
        }}
      />
      <Stack.Screen
        name="verify-otp"
        options={{
          title: 'Verify OTP',
        }}
      />
    </Stack>
  )
} 