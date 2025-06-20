import React, { useEffect } from 'react';
import { ExpoRoot } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LogBox, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';

// Ignore specific warnings
LogBox.ignoreLogs([
  'Cannot find native module',
  'requireNativeComponent',
  'RNCSafeAreaProvider'
]);

// Must be exported or Fast Refresh won't update the context
export function App() {
  const ctx = require.context('./app');
  
  useEffect(() => {
    // Hide splash screen after a delay
    setTimeout(async () => {
      await SplashScreen.hideAsync();
    }, 1000);
  }, []);

  // Use root-level error boundary
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ExpoRoot context={ctx} />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App; 