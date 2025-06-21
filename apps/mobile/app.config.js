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
    bundleIdentifier: "com.bigshots.pitara"
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/Assets/pitaralogo.png',
      backgroundColor: '#ffffff'
    },
    package: 'com.bigshots.pitara',
    permissions: [
      "NOTIFICATIONS",
      "WAKE_LOCK",
      "INTERNET",
      "ACCESS_NETWORK_STATE"
    ]
  },
  web: {
    favicon: './assets/Assets/pitaralogo.png'
  },
  plugins: [
    'expo-router',
    'expo-notifications',
    [
      'expo-build-properties',
      {
        android: {
          usesCleartextTraffic: true,
          enableProguardInReleaseBuilds: true,
          enableShrinkResourcesInReleaseBuilds: true,
          compileSdkVersion: 34,
          targetSdkVersion: 34,
          minSdkVersion: 23,
          buildToolsVersion: "34.0.0"
        },
        ios: {
          deploymentTarget: '13.4'
        }
      }
    ]
  ],
  scheme: "pitara",
  extra: {
    EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL || "https://jdfnkvbfpvzddjtgiovj.supabase.co",
    EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkZm5rdmJmcHZ6ZGRqdGdpb3ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3ODE5OTcsImV4cCI6MjA2NTM1Nzk5N30.zHUA-ESeIWzsfEpkt6O7-nWOBLaBf8MCEQlUb2JcnOI",
    razorpayKey: process.env.EXPO_PUBLIC_RAZORPAY_KEY,
    EXPO_PUBLIC_GOOGLE_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
    EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || "1089697091920-0b2qntimau4d59chhqouu6i8j4u1e6oi.apps.googleusercontent.com",
    EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    eas: {
      projectId: '1f53a5fe-e196-439b-8bae-08d80e8c54af'
    }
  },
  owner: "pmp16",
  sdkVersion: "51.0.0",
  experiments: {
    tsconfigPaths: true
  }
}; 