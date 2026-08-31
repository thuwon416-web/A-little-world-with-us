# Build Instructions

## Prerequisites

1. Install EAS CLI:
```bash
npm install -g eas-cli
```

2. Login to Expo:
```bash
eas login
```

3. Configure project:
```bash
eas build:configure
```

## Build Android APK

### Development Build (for testing)
```bash
eas build --platform android --profile development
```

### Preview Build (APK for distribution)
```bash
eas build --platform android --profile preview
```

### Production Build (for Play Store)
```bash
eas build --platform android --profile production
```

## Download APK

After build completes:
1. Go to https://expo.dev
2. Navigate to your project
3. Download the APK file
4. Install on Android device

## Local Build (Advanced)

```bash
eas build --platform android --local
```

This requires Android Studio and Java SDK.
