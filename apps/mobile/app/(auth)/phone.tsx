import React, { useState } from 'react';
import { View, StyleSheet, Alert, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { supabase } from '@pitara/supabase';
import { StatusBar } from 'expo-status-bar';

export default function PhoneLoginScreen() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSendOTP = async () => {
    // Validate phone number format
    const phoneRegex = /^[6-9]\d{9}$/;
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (!cleanPhone || !phoneRegex.test(cleanPhone)) {
      Alert.alert('Invalid Phone', 'Please enter a valid 10-digit Indian phone number');
      return;
    }

    try {
      setLoading(true);
      
      // Format phone number with country code
      const formattedPhone = `+91${cleanPhone}`;
      
      // Get Supabase configuration
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
          body: JSON.stringify({ phone: formattedPhone }),
        }
      );

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const result = await response.json();
      
      if (result.success) {
        router.push({
          pathname: '/(auth)/verify-otp',
          params: { phone: formattedPhone }
        });
      } else {
        const errorMessage = result.error || 'Failed to send OTP';
        Alert.alert('Error', errorMessage);
      }
    } catch (error) {
      console.error('OTP send error:', error);
      Alert.alert(
        'Connection Error', 
        'Failed to connect to the server. Please check your internet connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <StatusBar translucent backgroundColor="transparent" style="light" />
        
        <Text style={styles.title}>Login with Phone</Text>
        <Text style={styles.subtitle}>
          We'll send you a one-time password from our company Big Shot Production to your phone number.
        </Text>
        
        <TextInput
          label="Phone Number"
          value={phone}
          onChangeText={(text) => setPhone(text.replace(/\D/g, ''))}
          keyboardType="phone-pad"
          style={styles.input}
          placeholder="Enter your phone number"
          placeholderTextColor="#7c7c7c"
          left={<TextInput.Affix text="+91" />}
          disabled={loading}
          maxLength={10}
          textColor="#ffffff"
          theme={{ 
            colors: { 
              text: '#ffffff', 
              placeholder: '#aaaaaa', 
              primary: '#ff6b00', 
              background: '#1a1a1a' 
            },
          }}
        />
        
        <Button 
          mode="contained" 
          onPress={handleSendOTP}
          loading={loading}
          style={styles.button}
          disabled={phone.length !== 10 || loading}
        >
          Send OTP
        </Button>
        
        <Button 
          mode="text" 
          onPress={() => router.back()}
          style={styles.linkButton}
          textColor="#ff6b00"
          disabled={loading}
        >
          Go Back
        </Button>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
    textAlign: 'center',
    opacity: 0.6,
    color: '#cccccc',
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#1a1a1a',
    color: '#ffffff',
  },
  button: {
    marginTop: 8,
    paddingVertical: 8,
    backgroundColor: '#ff6b00',
  },
  linkButton: {
    marginTop: 16,
  },
}); 