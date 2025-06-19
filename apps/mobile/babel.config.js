module.exports = function (api) {
  api.cache(true)
  return {
    presets: ['babel-preset-expo', 'nativewind/babel'],
    plugins: [
      // Add React Native Paper plugin for vector icons
      'react-native-paper/babel',
      // Try more direct approach for reanimated
      require.resolve('react-native-reanimated/plugin'),
    ],
  }
} 