// This is the main entry point
import 'react-native-url-polyfill/auto';
import './global.css';
import { registerRootComponent } from 'expo';
import App from './App.js';
import * as WebBrowser from 'expo-web-browser';

// Ensure any pending auth sessions are completed and close the browser tab
WebBrowser.maybeCompleteAuthSession();

// Register the main component
registerRootComponent(App); 