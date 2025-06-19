import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '@pitara/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function TabLayout() {
  useEffect(() => {
    // Check for stored tokens in AsyncStorage as a backup
    const checkStoredTokens = async () => {
      try {
        const storedTokens = await AsyncStorage.getItem('pitara-auth-token');
        if (storedTokens) {
          console.log('Found stored tokens in AsyncStorage');
          const { access_token, refresh_token } = JSON.parse(storedTokens);
          
          if (access_token && refresh_token) {
            // Try to restore session from stored tokens
            const { error } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });
            
            if (error) {
              console.error('Error restoring session from stored tokens:', error);
            } else {
              console.log('Successfully restored session from stored tokens');
            }
          }
        }
      } catch (error) {
        console.error('Error checking stored tokens:', error);
      }
    };
    
    checkStoredTokens();
  }, []);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#ff6b00',
        tabBarInactiveTintColor: '#888888',
        tabBarStyle: {
          backgroundColor: '#000000',
          borderTopColor: '#333333',
        },
        headerStyle: {
          backgroundColor: '#000000',
        },
        headerTintColor: '#ffffff',
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <MaterialIcons name="home" size={24} color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color }) => <MaterialIcons name="search" size={24} color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="downloads"
        options={{
          title: 'Downloads',
          tabBarIcon: ({ color }) => <MaterialIcons name="file-download" size={24} color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <MaterialIcons name="person" size={24} color={color} />,
          headerShown: false,
        }}
      />
    </Tabs>
  );
} 