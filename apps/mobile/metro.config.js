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

// Set expo-router environment variables properly
process.env.EXPO_ROUTER_APP_ROOT = process.env.EXPO_ROUTER_APP_ROOT || './app';
process.env.EXPO_ROUTER_IMPORT_MODE = process.env.EXPO_ROUTER_IMPORT_MODE || 'sync';

/** @type {import('expo/metro-config').MetroConfig} */
// Use getDefaultConfig properly to extend expo/metro-config
const config = getDefaultConfig(__dirname);

// Fix for Expo SDK 51 Flow type issues - Enhanced transformer
config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve('@react-native/metro-babel-transformer'),
  unstable_allowRequireContext: true,
  // Disable ES6 transforms and add Flow handling
  unstable_disableES6Transforms: false,
  // Enable async require context
  asyncRequireModulePath: require.resolve('metro-runtime/src/modules/asyncRequire'),
  // Add minifier config to handle potential issues
  minifierConfig: {
    keep_fnames: true,
    mangle: {
      keep_fnames: true,
    },
  },
};

// Enhanced resolver configuration to completely exclude Flow types
config.resolver = {
  ...config.resolver,
  sourceExts: [...config.resolver.sourceExts.filter(ext => ext !== 'flow'), 'jsx', 'js', 'ts', 'tsx', 'json'],
  assetExts: [...config.resolver.assetExts, 'bin'],
  platforms: ['ios', 'android', 'native', 'web'],
  // Disable Flow completely and exclude Flow files
  flowConfigs: [],
  blockList: [
    // Block Flow spec files that cause issues
    /.*\/node_modules\/react-native\/src\/private\/specs\/.*$/,
    /.*\.flow$/,
  ],
  resolveRequest: (context, moduleName, platform) => {
    // Handle missing private React Native specs and provide empty implementations
    if (moduleName.includes('src/private/specs/') || 
        moduleName.includes('../../../src/private/specs/modules/')) {
      
      // Check if it's specifically NativeAccessibilityInfo or other known modules
      if (moduleName.includes('NativeAccessibilityInfo')) {
        return {
          type: 'sourceFile',
          filePath: path.resolve(__dirname, 'empty-modules/NativeAccessibilityInfo.js'),
        };
      }
      
      // For other private specs, return empty module
      return {
        type: 'sourceFile',
        filePath: path.resolve(__dirname, 'empty-module.js'),
      };
    }
    
    // Handle other native modules that might be missing
    if (moduleName.includes('NativeDialogManagerAndroid')) {
      return {
        type: 'empty',
      };
    }
    
    // Default resolver
    return context.resolveRequest(context, moduleName, platform);
  },
};

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