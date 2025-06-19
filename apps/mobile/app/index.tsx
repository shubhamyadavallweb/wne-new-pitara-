import React, { useEffect, useContext } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { AuthContext } from './_layout';

export default function Index() {
  const { session, loading } = useContext(AuthContext);
  const router = useRouter();
  
  useEffect(() => {
    if (!loading) {
      if (session) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/google');
      }
    }
  }, [session, loading, router]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Pitara</Text>
        <ActivityIndicator size="large" color="#ff6b00" style={styles.loader} />
        <Text style={styles.loadingText}>Loading your experience...</Text>
      </View>
    );
  }

  // This will render for a split second before the useEffect redirects
  return <Redirect href={session ? '/(tabs)' : '/(auth)/google'} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ff6b00',
    marginBottom: 24,
  },
  loader: {
    marginBottom: 16,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
  },
}); 