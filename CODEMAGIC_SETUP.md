# Codemagic Setup Instructions

## Required Environment Variables

Add these environment variables to your Codemagic project settings:

### Group: x

Add all these variables to the environment group named 'x':

#### Expo Token
```
EXPO_TOKEN=UBqDeYkD-XJ-NTmLOVNbs6BCiHsJiuU_tHwAYzog
```

#### Supabase Configuration
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ACCESS_TOKEN=your_access_token
SUPABASE_PROJECT_REF=your_project_ref
SUPABASE_DB_URL=your_db_url
```

#### Razorpay Configuration
```
EXPO_PUBLIC_RAZORPAY_KEY=your_razorpay_key
EXPO_PUBLIC_RAZORPAY_KEY_SECRET=your_razorpay_secret
EXPO_PUBLIC_RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

#### Google OAuth Configuration
```
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_web_client_id
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your_android_client_id
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your_ios_client_id
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_SECRET=your_web_secret
```

#### Other Configuration
```
EXPO_PUBLIC_BYPASS_AUTH=your_bypass_setting
EXPO_PUBLIC_BUNNY_CDN_URL=your_bunny_cdn_url
```

## How to Add Environment Variables in Codemagic:

1. Go to your Codemagic project settings
2. Navigate to "Environment variables"
3. Add group named 'x'
4. Add all the above variables to that group
5. Save the configuration

## Build Process:

Once environment variables are configured:
1. Push to `main` branch triggers automatic build
2. EAS Build process creates signed APK
3. APK will be available in artifacts section
4. Email notification with download link

## Troubleshooting:

- If build fails with "EXPO_TOKEN not set", verify the token is added correctly
- Ensure all required variables are in the 'x' group
- Check build logs for specific error messages 