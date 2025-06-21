# APK Build Instructions for Pitara Mobile App

## Overview
यह document बताता है कि कैसे Pitara mobile app के लिए production APK build करें।

## Prerequisites
- Node.js (v20.11.1 recommended)
- Java 17
- Android SDK
- Expo CLI

## Build Configurations

### 1. Development Build
```bash
cd apps/mobile
npm run start
```

### 2. Preview APK (Internal Testing)
```bash
cd apps/mobile
npm run build:preview
```

### 3. Production APK (Release)
```bash
cd apps/mobile
npm run build:production
```

### 4. Local Build (Direct APK Generation)
```bash
cd apps/mobile
npm run prebuild
npm run build:local
```

## EAS Build Profiles

### Production Profile
- **Purpose**: Release-ready APK for store distribution
- **Configuration**: 
  - `developmentClient: false`
  - `distribution: "store"`
  - `buildType: "apk"`
  - ProGuard enabled
  - Resource shrinking enabled

### Preview Profile  
- **Purpose**: Internal testing APK
- **Configuration**:
  - `distribution: "internal"`
  - `buildType: "apk"`

## CodeMagic CI/CD

### Automatic Build Triggers
- **Debug APK**: Builds on pull requests
- **Release APK**: Builds on push to `main` branch

### Environment Variables Required
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`
- `CM_KEYSTORE_FILENAME`  
- `CM_KEYSTORE_PASSWORD`
- `CM_KEY_ALIAS`
- `CM_KEY_PASSWORD`

### Artifact Locations
- Debug APK: `apps/mobile/android/app/build/outputs/apk/debug/`
- Release APK: `apps/mobile/android/app/build/outputs/apk/release/`

## Android Signing

### Keystore Configuration
- Keystore file: `@pmp16__pitara-mobile.jks`
- Base64 encoded version: `keystore_base64.txt`
- Package name: `com.bigshots.pitara`

### Build Types
- **Debug**: Uses debug keystore, development settings
- **Release**: Uses production keystore, optimized for distribution

## Installation on Android Device

### Method 1: Direct Install
1. Download APK from CodeMagic artifacts
2. Enable "Unknown Sources" in Android settings
3. Install APK file directly

### Method 2: ADB Install
```bash
adb install path/to/your/app-release.apk
```

## Troubleshooting

### Common Issues
1. **Keystore not found**: Ensure `keystore_base64.txt` exists
2. **Environment variables missing**: Check CodeMagic environment setup
3. **Build fails**: Check Java and Node.js versions

### Build Optimization
- ProGuard enabled for code obfuscation
- Resource shrinking enabled to reduce APK size  
- Separate builds per CPU architecture disabled for universal APK

## App Information
- **App Name**: Pitara
- **Package**: com.bigshots.pitara
- **Version**: 1.0.0
- **Target SDK**: 34
- **Min SDK**: 21

## Support
For build issues, check:
1. CodeMagic build logs
2. EAS build dashboard
3. Expo documentation 