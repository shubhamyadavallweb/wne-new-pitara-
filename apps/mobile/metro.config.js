// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const { withNativeWind } = require('nativewind/metro');   

// Find the project and workspace directories
const projectRoot = __dirname;
// This can be replaced with `find-yarn-workspace-root`  
const workspaceRoot = path.resolve(projectRoot, '../..');

/** @type {import('expo/metro-config').MetroConfig} */   
const config = getDefaultConfig(projectRoot, {
  // [Web-only]: Enables CSS support in Metro.
  isCSSEnabled: true,
});

// 1. Watch all files within the monorepo
config.watchFolders = [workspaceRoot];
// 2. Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPaths = [
  path.resolve(workspaceRoot, 'node_modules'),
  path.resolve(projectRoot, 'node_modules'),
];

// Load environment variables with dotenv
require('dotenv').config({ path: path.resolve(workspaceRoot, '.env') });

// 3. Force Metro to resolve (sub)dependencies only from the `nodeModulesPaths`
config.resolver.disableHierarchicalLookup = true;

// Configure extraNodeModules to ensure consistent resolution
config.resolver.extraNodeModules = {
  'react-native-safe-area-context': path.resolve(workspaceRoot, 'node_modules/react-native-safe-area-context'),
};

// Apply NativeWind configuration
const nativeWindConfig = withNativeWind(config, { input: './global.css' });

module.exports = nativeWindConfig; 