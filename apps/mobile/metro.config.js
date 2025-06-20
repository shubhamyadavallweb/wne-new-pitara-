// Learn more https://docs.expo.io/guides/customizing-metro
const { getSentryExpoConfig } = require('@sentry/react-native/metro');
const path = require('path');
// Fix nativewind module loading - Make it optional
let nativewindModule = null;
try {
  nativewindModule = require('nativewind/metro');
} catch (error) {
  console.warn('nativewind/metro not available, continuing without it');
}

// Get the root of the monorepo
const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getSentryExpoConfig(projectRoot);

// 1. Watch all files in the monorepo
config.watchFolders = [monorepoRoot];

// 2. Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// 3. Force Metro to resolve (sub)dependencies from the project's root node_modules
config.resolver.disableHierarchicalLookup = true;

// Load environment variables with dotenv
require('dotenv').config({ path: path.resolve(monorepoRoot, '.env') });

// Configure extraNodeModules to ensure consistent resolution
config.resolver.extraNodeModules = {
  'react-native-safe-area-context': path.resolve(monorepoRoot, 'node_modules/react-native-safe-area-context'),
};

// Apply NativeWind configuration only if available
let finalConfig = config;
if (nativewindModule && nativewindModule.withNativeWind) {
  finalConfig = nativewindModule.withNativeWind(config, { input: './global.css' });
}

module.exports = finalConfig; 