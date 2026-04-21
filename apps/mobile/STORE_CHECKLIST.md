# Store Submission Checklist

## Required assets to add to `assets/`

| File | Size | Format | Required for |
|---|---|---|---|
| `icon.png` | 1024×1024 px | PNG, no transparency | iOS + Android |
| `adaptive-icon.png` | 1024×1024 px | PNG, transparent bg | Android adaptive icon |
| `splash.png` | 1284×2778 px | PNG | Launch screen |
| `favicon.png` | 48×48 px | PNG | Web |
| `notification-icon.png` | 96×96 px | PNG, white on transparent | Android notifications |

Background color: `#04070f` (near-black)
Brand color: `#635bff` (indigo)

---

## Before first EAS build

1. Create EAS project:
   ```
   npx eas-cli init
   ```
   Then update `app.json` → `extra.eas.projectId` with the generated ID.

2. iOS (requires paid Apple Developer account $99/yr):
   - Create App ID `com.instanttalk.app` in Apple Developer portal
   - Create App in App Store Connect
   - Update `eas.json` → `submit.production.ios.appleId / ascAppId / appleTeamId`

3. Android (requires Google Play account $25 one-time):
   - Create app `com.instanttalk.app` in Play Console
   - Download service account JSON → save as `google-play-service-account.json`
   - Grant the service account Release Manager permissions

---

## Build commands

```bash
# Development APK (Android, no signing required)
npx eas-cli build --platform android --profile development

# Internal preview APK
npx eas-cli build --platform android --profile preview

# Production AAB (Play Store)
npx eas-cli build --platform android --profile production

# Production IPA (App Store)
npx eas-cli build --platform ios --profile production

# Submit to stores (after production build)
npx eas-cli submit --platform android --profile production
npx eas-cli submit --platform ios --profile production
```

---

## Play Store listing requirements

- App title: `Instant Talk – Live Translation`
- Short description (≤80 chars): `Real-time multilingual meetings in 26 languages`
- Full description: see `STORE_DESCRIPTIONS.md`
- Screenshots: at least 2 per device type (phone + 7-inch tablet)
- Feature graphic: 1024×500 px
- Content rating: Everyone
- Data safety form: complete using Data Usage screen content

## App Store listing requirements

- App name: `Instant Talk`
- Subtitle (≤30 chars): `Multilingual Meetings`
- Description: see `STORE_DESCRIPTIONS.md`
- Screenshots: iPhone 6.7" + 6.5" + iPad Pro 12.9" (required)
- Privacy policy URL: `https://instant-talk.com/privacy`
- Support URL: `https://instant-talk.com/contact`
- App Review notes: The app uses a WebView for the meeting room that requires microphone/camera. The native shell handles scheduling, contacts, and settings.

---

## In-app compliance (already implemented)

- [x] Privacy Policy screen → `/app/privacy-policy.tsx`
- [x] Terms of Service screen → `/app/terms.tsx`
- [x] Data Usage disclosure → `/app/data-usage.tsx`
- [x] Permissions explanation → `/app/permissions.tsx`
- [x] All accessible from Settings → Legal section
- [x] iOS NSMicrophoneUsageDescription set
- [x] iOS NSCameraUsageDescription set
- [x] iOS UIBackgroundModes: audio + voip
- [x] iOS ITSAppUsesNonExemptEncryption: false
- [x] iOS Privacy Manifests added
- [x] Android CAMERA + RECORD_AUDIO + FOREGROUND_SERVICE declared
- [x] Android POST_NOTIFICATIONS declared
- [x] App does not track users (ATT prompt not needed)
