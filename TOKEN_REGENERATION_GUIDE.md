# EXPO_TOKEN Regeneration Guide

## Steps to Generate Valid EXPO_TOKEN:

### 1. Install Expo CLI
```bash
npm install -g @expo/cli@latest
```

### 2. Login to Expo
```bash
npx expo login
```
Enter your Expo account credentials.

### 3. Generate Token
```bash
npx expo token:create
```

### 4. Copy the Generated Token
The command will output a token like: `expo_abc123...`

### 5. Add to Codemagic
1. Go to Codemagic → Environment variables
2. Find EXPO_TOKEN
3. Update the value with new token
4. **IMPORTANT:** Set Variable group to `x`
5. Save changes

### 6. Verify Token
```bash
export EXPO_TOKEN="your_new_token_here"
npx expo whoami
```

Should show your Expo username if token is valid.

## Important Notes:
- Token must have proper permissions
- Token should not be expired
- Must be in variable group `x` in Codemagic
- Token format: `expo_xxxxxxxxxxxxx` 