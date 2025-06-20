// This is the main entry point
import 'react-native-url-polyfill/auto';
import './global.css';
import { registerRootComponent } from 'expo';
import App from './App.js';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import Constants from 'expo-constants';

// Configure Linking with the scheme from app.config.js
const prefix = Linking.createURL('/');
const scheme = Constants.expoConfig.scheme || 'pitara';
Linking.addEventListener('url', event => {
  // Handle deep links here if needed
  console.log('Deep link received:', event.url);
});

// Ensure any pending auth sessions are completed and close the browser tab
WebBrowser.maybeCompleteAuthSession();

// Register the main component
registerRootComponent(App); 