# Pitara Mobile - React Native App

A cross-platform mobile application built with Expo, React Native, and Supabase.

## 🏗️ Architecture

This is a monorepo containing:

- **apps/mobile** - The main React Native app using Expo Router
- **packages/supabase** - Shared Supabase client configuration
- **packages/hooks** - Shared React hooks (authentication, etc.)
- **packages/ui** - Shared UI components
- **packages/video** - Video-related utilities (future)

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ and npm
- Expo CLI: `npm install -g @expo/cli`
- For iOS development: Xcode (macOS only)
- For Android development: Android Studio

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <your-repo>
   cd newpitara
   npm install
   ```

2. **Set up environment variables:**
   Create `apps/mobile/.env` with:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   EXPO_PUBLIC_GOOGLE_CLIENT_ID=your-google-oauth-client-id
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   # or
   cd apps/mobile && npx expo start
   ```

### Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Get your project URL and anon key from Settings > API
3. Set up Google OAuth:
   - Go to Authentication > Providers > Google
   - Add your Google OAuth credentials
   - Add redirect URL: `com.pitara.mobile://auth/callback`

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create/select a project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add your bundle ID: `com.pitara.mobile`

## 📱 Development

### Running the App

```bash
# Start Metro bundler
npm run dev

# Or directly in mobile app
cd apps/mobile
npx expo start

# Run on specific platform
npx expo start --ios
npx expo start --android
```

### Project Structure

```
newpitara/
├── apps/
│   └── mobile/                 # Main React Native app
│       ├── app/               # Expo Router pages
│       │   ├── (auth)/        # Authentication screens
│       │   ├── (tabs)/        # Main tab navigation
│       │   ├── _layout.tsx    # Root layout
│       │   └── index.tsx      # Entry point
│       ├── assets/            # Images, fonts, etc.
│       └── ...
├── packages/
│   ├── supabase/             # Supabase client
│   ├── hooks/                # Shared React hooks
│   ├── ui/                   # UI components
│   └── video/                # Video utilities
└── package.json              # Workspace root
```

## 🔧 Technologies Used

- **Expo Router** - File-based routing
- **Supabase** - Backend as a Service (Auth, Database)
- **NativeWind** - Tailwind CSS for React Native
- **TypeScript** - Type safety
- **Expo Auth Session** - OAuth authentication
- **React Native Reanimated** - Animations
- **Gorhom Bottom Sheet** - Bottom sheet component

## 🎯 Features

- ✅ Google OAuth authentication
- ✅ Tab-based navigation
- ✅ Responsive design with NativeWind
- ✅ TypeScript support
- ✅ Monorepo architecture
- 🚧 Video streaming (planned)
- 🚧 Offline downloads (planned)
- 🚧 Push notifications (planned)

## 📲 Building for Production

### EAS Build Setup

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
npx expo login

# Configure EAS
cd apps/mobile
eas build:configure

# Build for Android
eas build --platform android --profile preview

# Build for iOS
eas build --platform ios --profile preview
```

### Environment Variables for Production

Make sure to set production environment variables in:
- `eas.json` for EAS builds
- Expo dashboard for OTA updates

## 🐛 Troubleshooting

### Common Issues

1. **Metro bundler issues:**
   ```bash
   cd apps/mobile
   npx expo start --clear
   ```

2. **Package resolution issues:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **iOS simulator not opening:**
   ```bash
   npx expo install --fix
   ```

## 📚 Documentation

- [Expo Documentation](https://docs.expo.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [NativeWind Documentation](https://www.nativewind.dev/)
- [React Navigation](https://reactnavigation.org/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## Setup Complete

The main integration of Nimbus SMS OTP authentication with Supabase is now complete. This includes:

- ✅ Database tables in Supabase (otps, profiles, subscriptions)
- ✅ Edge Functions for OTP sending and verification
- ✅ OTP rate limiting and security improvements
- ✅ UI screens for phone input and OTP verification

## Testing OTP Authentication

### Using the Mobile App

To test the OTP authentication flow in the app:

1. Start the application:
   ```
   cd apps/mobile && npx expo start
   ```

2. Use the Expo Go app on your device or an emulator to scan the QR code

3. Test the authentication flow:
   - Enter a valid phone number on the login screen
   - You should receive an OTP via SMS (if using a real device)
   - Enter the OTP in the verification screen
   - Upon successful verification, you should be logged in and redirected to the home screen

### Using Test Scripts

For quicker testing of the OTP functionality without launching the full app, you can use the provided test scripts:

1. Interactive Test (recommended):
   ```
   cd apps/mobile && node test-otp-interactive.js
   ```
   This script will:
   - Prompt for a phone number (or take it as a command-line argument)
   - Send the OTP to that number
   - Prompt you to enter the received OTP
   - Verify the OTP and show the authentication result

2. Basic Test:
   ```
   cd apps/mobile && node test-otp.js +919876543210
   ```
   Replace `+919876543210` with your phone number. This script will send an OTP but won't verify it.

## Nimbus SMS Integration

The Nimbus SMS integration is configured with the following credentials:

- **User ID:** Bigshotsnet
- **Auth Key:** 921neeZLrw6PQ
- **Sender ID:** BIGSHS
- **Entity ID:** 1101571660000076361
- **Template ID:** 1107170964588472006

These credentials have been set as environment variables for the edge functions.

## Production Deployment

For production deployment, follow these steps:

1. Update the Supabase service role key in `.env` file:
   ```
   SUPABASE_SERVICE_ROLE_KEY=your_new_project_service_role_key
   ```

2. Make sure the Nimbus SMS API credentials are set as environment variables in the Supabase Edge Function configuration.

3. Configure EAS Build for app distribution:
   ```
   cd apps/mobile
   eas build:configure
   ```

4. Create a production build:
   ```
   eas build --platform all --profile production
   ```

## Security Considerations

The implementation includes these security measures:

- Rate limiting for OTP requests (maximum 3 requests per 2 minutes)
- OTP attempt tracking to prevent brute force attacks
- Secure session management with Supabase
- OTP expiry (5 minutes)
- Proper error handling and user guidance

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Expo Documentation](https://docs.expo.dev)
- [Nimbus SMS API Documentation](https://nimbusit.com/docs) 