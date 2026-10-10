# Videa Mobile (React Native)

This is an Expo / React Native Android and iOS app shell for the existing Videa website. It keeps the website's current pages, API routes, database, and responsive UI, while providing a native app container with a branded header, Android back navigation, loading indicator, refresh, and offline retry screen.

Website: https://videa-khaki.vercel.app

## Run locally

Install Node.js 20 or newer, then:

```bash
cd mobile
npm install
npx expo start
```

Install Expo Go on your phone and scan the QR code to test the shell. For a standalone installable Android app, use an EAS APK build below.

## Create a downloadable Android APK

1. Create or sign in to an Expo account: https://expo.dev/
2. From this `mobile` folder, run:

```bash
npm install
npx eas-cli login
npx eas-cli build:configure
npx eas-cli build --platform android --profile preview
```

3. When the cloud build finishes, open the build URL Expo provides and download the APK to your Android phone.
4. Open the APK and allow installation from that source if Android asks.

The `preview` profile is configured to produce an APK suitable for direct installation. For Google Play, use the production profile, which normally generates an Android App Bundle (AAB).

## Notes

- The mobile app currently loads the live Videa website from the configured HTTPS URL; changes to the website remain available without rebuilding the app.
- Website authentication, creator subscriptions, wallet and API access remain controlled by the existing Videa server.
- Before publishing publicly, test Google sign-in on real Android/iOS devices. Google may block OAuth flows inside embedded WebViews. If that occurs, the app should be upgraded to a native Google OAuth flow and a server-supported mobile session rather than trying to bypass Google's restriction.
- Update `expo.extra.websiteUrl` in `app.json` and `WEBSITE_URL` in `App.js` if the production domain changes.
