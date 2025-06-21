module.exports = function (api) {
  api.cache(true)
  return {
    presets: [
      ['babel-preset-expo', {
        jsxRuntime: 'automatic',
        web: {
          unstable_transformProfile: 'hermes'
        }
      }],
      'nativewind/babel'
    ],
    plugins: [
      // Add React Native Paper plugin for vector icons
      'react-native-paper/babel',
      // Try more direct approach for reanimated
      require.resolve('react-native-reanimated/plugin'),
    ],
    env: {
      production: {
        plugins: ['react-native-paper/babel']
      }
    }
  }
} 