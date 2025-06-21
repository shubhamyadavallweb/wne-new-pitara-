// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
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
// Use getDefaultConfig properly to extend expo/metro-config
const config = getDefaultConfig(__dirname);

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
  ...config.resolver.extraNodeModules,
  'react-native-safe-area-context': path.resolve(monorepoRoot, 'node_modules/react-native-safe-area-context'),
};

// Apply NativeWind configuration only if available
if (nativewindModule && nativewindModule.withNativeWind) {
  module.exports = nativewindModule.withNativeWind(config, { input: './global.css' });
} else {
  module.exports = config;
} 