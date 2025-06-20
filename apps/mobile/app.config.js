import 'dotenv/config';

module.exports = {
  name: 'Pitara',
  slug: 'pitara-mobile',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/Assets/pitaralogo.png',
  userInterfaceStyle: 'light',
  splash: {
    image: './assets/Assets/pitaralogo.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff'
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.bigshots.pitara",
    scheme: "pitara",
    config: {
      googleSignIn: {
        reservedClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID
      }
    },
    deploymentTarget: '15.1'
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/Assets/pitaralogo.png',
      backgroundColor: '#ffffff'
    },
    package: 'com.bigshots.pitara',
    scheme: "pitara",
    permissions: [
      "NOTIFICATIONS",
      "WAKE_LOCK",
      "INTERNET",
      "ACCESS_NETWORK_STATE"
    ],
    versionCode: 3
  },
  web: {
    favicon: './assets/Assets/pitaralogo.png'
  },
  plugins: [
    'expo-router',
    'expo-video',
    [
      'expo-build-properties',
      {
        android: {
          usesCleartextTraffic: true
        },
        ios: {
          deploymentTarget: '15.1'
        }
      }
    ]
  ],
  scheme: "pitara",
  extra: {
    EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
    EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    razorpayKey: process.env.EXPO_PUBLIC_RAZORPAY_KEY,
    EXPO_PUBLIC_GOOGLE_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
    EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    eas: {
      projectId: '1f53a5fe-e196-439b-8bae-08d80e8c54af'
    }
  },
  owner: "pmp16",
  experiments: {
    tsconfigPaths: true
  }
}; 