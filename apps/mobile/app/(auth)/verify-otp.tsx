import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Platform } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@pitara/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function VerifyOTPScreen() {
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(60);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const router = useRouter();
  const { phone } = useLocalSearchParams();
  
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);
  
  const handleVerifyOTP = async () => {
    // Validate OTP format
    if (!otp || otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      Alert.alert('Invalid OTP', 'Please enter a valid 6-digit OTP');
      return;
    }

    try {
      setLoading(true);
      const formattedPhone = typeof phone === 'string' ? phone : Array.isArray(phone) ? phone[0] : String(phone);
      console.log('Starting OTP verification for phone:', formattedPhone);
      
      // Check if user has exceeded max attempts
      if (attempts >= 5) {
        Alert.alert(
          'Too Many Attempts', 
          'You have exceeded the maximum number of attempts. Please request a new OTP.',
          [{ text: 'OK', onPress: () => router.replace('/(auth)/phone') }]
        );
        return;
      }
      
      // Call our edge function to verify OTP
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase configuration is missing');
      }

      console.log('Calling verify-otp edge function');
      
      const response = await fetch(
        `${supabaseUrl}/functions/v1/verify-otp`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify({ phone: formattedPhone, otp }),
        }
      );

      const result = await response.json();
      console.log('Received response:', response.status);
      console.log('Response body:', JSON.stringify(result, null, 2));
      
      if (response.ok && result.access_token) {
        console.log('OTP verified successfully');
        
        try {
          // Store tokens in AsyncStorage directly first as a backup
          await AsyncStorage.setItem('pitara-auth-token', JSON.stringify({
            access_token: result.access_token,
            refresh_token: result.refresh_token,
            user: result.user
          }));
          
          // Then try setting session with Supabase client
          const { data, error } = await supabase.auth.setSession({
            access_token: result.access_token,
            refresh_token: result.refresh_token,
          });
          
          if (error) {
            console.error('Error setting session:', error);
            
            // Try a different approach - use signInWithPhone directly
            try {
              // Force a session refresh
              await supabase.auth.refreshSession();
              
              // Get current session
              const { data: { session } } = await supabase.auth.getSession();
              
              if (session) {
                console.log('Session exists after refresh, navigating to home');
                router.replace('/(tabs)');
              } else {
                // Try to manually set user in storage and navigate
                console.log('No session after refresh, trying manual navigation');
                router.replace('/(tabs)');
              }
            } catch (refreshError) {
              console.error('Session refresh error:', refreshError);
              Alert.alert('Authentication Error', 'Failed to refresh session. Please try again.');
            }
          } else {
            console.log('Session set successfully:', data.session ? 'Session exists' : 'No session');
            
            // Verify session
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
              console.log('Session verified, navigating to home');
              router.replace('/(tabs)');
            } else {
              console.error('Session verification failed');
              // Try to navigate anyway
              router.replace('/(tabs)');
            }
          }
        } catch (err: any) {
          console.error('Session setting exception:', err);
          // Try to navigate anyway if we have tokens
          if (result.access_token) {
            router.replace('/(tabs)');
          } else {
            Alert.alert('Authentication Error', err.message || 'Unexpected error.');
          }
        }
      } else {
        console.log('OTP verification failed:', result.error);
        // Increment attempts counter
        setAttempts(prev => prev + 1);
        
        // Handle specific errors
        if (response.status === 429) {
          Alert.alert(
            'Too Many Attempts',
            'You have exceeded the maximum number of attempts. Please try again later.',
            [{ text: 'OK', onPress: () => router.replace('/(auth)/phone') }]
          );
        } else if (response.status === 401) {
          Alert.alert('Invalid OTP', 'The OTP you entered is incorrect or has expired. Please try again.');
        } else {
          Alert.alert('Error', result.error || 'Failed to verify OTP');
        }
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      Alert.alert('Connection Error', 'Failed to connect to the server. Please check your internet connection and try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleResendOTP = async () => {
    if (timer > 0) return;
    
    try {
      setResending(true);
      
      // Call our edge function to resend OTP
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase configuration is missing');
      }
      
      const response = await fetch(
        `${supabaseUrl}/functions/v1/send-otp`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify({ phone }),
        }
      );

      const result = await response.json();
      
      if (result.success) {
        // Reset timer and attempts
        setTimer(60);
        setAttempts(0);
        setOtp('');
        Alert.alert('Success', 'A new OTP has been sent to your phone');
      } else {
        if (response.status === 429) {
          Alert.alert(
            'Rate Limited',
            'Too many OTP requests. Please wait before requesting another OTP.',
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert('Error', result.error || 'Failed to resend OTP');
        }
      }
    } catch (error) {
      console.error('OTP resend error:', error);
      Alert.alert('Connection Error', 'Failed to connect to the server. Please check your internet connection and try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verify Your Phone</Text>
      <Text style={styles.subtitle}>
        We've sent a 6-digit code to {phone}.{'\n'}
        Please enter it below.
      </Text>
      
      <TextInput
        label="OTP Code"
        value={otp}
        onChangeText={setOtp}
        keyboardType="number-pad"
        style={styles.input}
        placeholder="Enter 6-digit code"
        placeholderTextColor="#7c7c7c"
        textColor="#ffffff"
        theme={{ 
          colors: { 
            text: '#ffffff', 
            placeholder: '#aaaaaa', 
            primary: '#ff6b00', 
            background: '#1e1e1e',
          },
        }}
        maxLength={6}
        disabled={loading}
        autoFocus
      />
      
      <Button 
        mode="contained" 
        onPress={handleVerifyOTP}
        loading={loading}
        style={styles.button}
      >
        Verify & Login
      </Button>
      
      <Button 
        mode="text" 
        onPress={handleResendOTP}
        loading={resending}
        disabled={timer > 0 || resending}
        style={styles.linkButton}
      >
        {timer > 0 ? `Resend OTP in ${timer}s` : 'Resend OTP'}
      </Button>
      
      <Button 
        mode="text" 
        onPress={() => router.back()}
        style={styles.linkButton}
      >
        Change Phone Number
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#000000',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#b3b3b3',
    marginBottom: 32,
    textAlign: 'center',
  },
  input: {
    marginBottom: 24,
    backgroundColor: '#1e1e1e',
    color: '#ffffff',
  },
  button: {
    marginBottom: 16,
    paddingVertical: 8,
    backgroundColor: '#ff6b00',
  },
  linkButton: {
    marginBottom: 8,
  },
}); 