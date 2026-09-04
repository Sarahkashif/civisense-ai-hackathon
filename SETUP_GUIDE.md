# CiviSense AI — Setup & Build Guide

This guide covers three deployment targets: **Web (Vercel)**, **Android (APK/AAB)**, and **iOS**.

---

## 1. Supabase Backend Setup (Required for Cross-Device Sync)

The app uses [Supabase](https://supabase.com) as its shared database. Without it, the app runs in localStorage-only mode (complaints stay on one device).

### Step 1: Create a Supabase Project
1. Go to https://supabase.com and sign up (free)
2. Click **New Project**
3. Name it `civisense-ai`, choose any region, set a database password
4. Wait ~2 minutes for the project to provision

### Step 2: Run the Database Schema
1. In your Supabase dashboard, open **SQL Editor**
2. Copy the entire contents of `supabase/schema.sql` (in this project)
3. Paste it into the SQL Editor and click **Run**
4. This creates the `users` and `complaints` tables with Row Level Security policies

### Step 3: Get Your API Credentials
1. Go to **Settings > API** in the Supabase dashboard
2. Copy:
   - **Project URL** (looks like `https://abcdefgh.supabase.co`)
   - **anon public** key (a long `eyJ...` string)

### Step 4: Configure the App

**For local development:**
Edit `.env` in the project root:
```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**For Vercel (web version):**
1. Go to your Vercel dashboard > civisense-ai project > Settings > Environment Variables
2. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` with your values
3. Redeploy the project

**For Android/iOS apps:**
The `.env` values are baked in at build time. Set them in `.env` before running `npm run build`.

### How Cross-Device Sync Works
Once Supabase is configured:
- A complaint submitted on a phone is stored in the Supabase database
- Any other device (laptop, tablet) sees it instantly in the Authority Dashboard
- The same user can log in on any device and track their complaints by ID
- All dashboard metrics (Total Reports, High Priority, etc.) are computed live from the database

---

## 2. Web Version (Vercel)

Already deployed at **https://civisense-ai.vercel.app**

To redeploy after changes:
```bash
npm run build
npx vercel deploy --prod --yes
```

---

## 3. Android App (APK/AAB)

### Prerequisites
- Android Studio installed (https://developer.android.com/studio)
- Android SDK 33+ (installed via Android Studio > SDK Manager)
- JDK 21 — on this machine Android Studio's JDK lives at `C:\Users\DELL\.jdks\jbr-21.0.11`
  (NOTE: Android Studio's bundled `jbr` folder is Java 25 on this machine, which Gradle 8.14.3 cannot use — always set `JAVA_HOME` to the JDK 21 path)

### Build the APK

```powershell
# 0. Set JAVA_HOME for the session (JDK 21)
$env:JAVA_HOME = "C:\Users\DELL\.jdks\jbr-21.0.11"
$env:Path = "$env:JAVA_HOME\bin;" + $env:Path

# 1. Build the web app
npm run build

# 2. Sync web assets to the Android project
npx cap sync android

# 3. Build the APKs (choose ONE method):

# Method A: Command line — use --no-daemon to avoid Gradle daemon stalls on Windows
cd android
gradlew.bat assembleDebug --no-daemon
# Debug APK: android/app/build/outputs/apk/debug/app-debug.apk

gradlew.bat assembleRelease --no-daemon
# Release APK (signed): android/app/build/outputs/apk/release/app-release.apk

# Method B: Android Studio
npx cap open android
# Then in Android Studio: Build > Build Bundle(s)/APK(s) > Build APK(s)
```

### Install the APK on a Phone
1. Copy `app-release.apk` (recommended) or `app-debug.apk` to your Android phone (USB, email, cloud drive)
2. On the phone, tap the APK file
3. Allow "Install from unknown sources" if prompted
4. The CiviSense AI app installs with its icon and opens as a native app
5. First voice input use will request Microphone permission — tap Allow

### Release Signing
Release builds are signed with `android/civisense-release.keystore` (auto-detected via `android/keystore.properties`).
- Keep both files private — they are gitignored. Losing them means app updates need a new package ID.
- Credentials are in `android/keystore.properties`.

### Native Voice Input in the APK
The APK uses the `@capacitor-community/speech-recognition` plugin (Android's native speech recognizer) because the Web Speech API does not run inside the Android WebView. Language availability (English/Urdu/Sindhi) follows the speech services installed on the device (Google app provides all three).

### Build a Release AAB (for Google Play)
```powershell
cd android
gradlew.bat bundleRelease --no-daemon
# AAB output: android/app/build/outputs/bundle/release/app-release.aab
```
Note: Play Store release additionally requires a Google Play Developer account ($25 one-time).

### After Changing Web Code
Any time you change the web app code, rebuild and resync before rebuilding the APK:
```bash
npm run build
npx cap sync android
```

---

## 4. iOS App

iOS builds require macOS with Xcode (cannot be built on Windows).

### On a Mac:
```bash
# 1. Ensure the iOS platform is added
npx cap add ios

# 2. Sync web assets
npm run build
npx cap sync ios

# 3. Open in Xcode
npx cap open ios

# 4. In Xcode: select your device/simulator, click Run
# Or build an archive: Product > Archive
```

- App Store distribution requires an Apple Developer account ($99/year)
- Free Apple ID allows running on your own device via Xcode

---

## 5. Project Structure

```
civisense-ai/
├── android/                  # Android native project (Capacitor)
├── supabase/
│   └── schema.sql            # Database schema — run in Supabase SQL Editor
├── public/
│   ├── manifest.json         # PWA manifest
│   ├── sw.js                 # Service worker (dev-safe)
│   └── icon-*.png            # App icons
├── src/
│   ├── services/
│   │   ├── supabaseClient.ts # Supabase connection (null when unconfigured)
│   │   ├── databaseService.ts# All DB operations (Supabase + localStorage fallback)
│   │   ├── storageService.ts # Re-exports databaseService
│   │   ├── complaintService.ts # High-level complaint operations
│   │   ├── authService.ts    # Login/signup/logout
│   │   └── analysisService.ts# Category + priority scoring engine
│   ├── pages/                # HomePage, ReportPage, TrackPage, etc.
│   ├── contexts/AuthContext.tsx
│   └── hooks/useComplaints.ts
├── capacitor.config.ts       # Capacitor config (appId: com.civisense.ai)
├── .env                      # Supabase credentials (DO NOT commit)
└── vite.config.ts
```

---

## 6. Voice Input Languages

The Report Issue page supports voice input in:
- **English** (en-US)
- **Urdu** (ur-PK)
- **Sindhi** (sd-PK)

Voice recognition uses two paths automatically:
- **Web (browsers)**: the Web Speech API
  - Chrome/Edge on desktop and Android: all three languages supported
  - iOS Safari: limited (typically English only)
- **Native app (APK)**: the `@capacitor-community/speech-recognition` plugin using Android's built-in speech recognizer (the Web Speech API does not work inside the Android WebView)
  - Language availability follows the speech services on the device; the Google app provides all three languages

In both paths, live partial results are shown as a gray preview and only finalized text is committed to the editable transcript — words are never duplicated.

To add more languages, edit `VOICE_LANGUAGES` in `src/pages/ReportPage.tsx`.

---

## 7. Troubleshooting

**App shows empty dashboard / no cross-device sync:**
Supabase is not configured. Complete Section 1 above.

**"Invalid supabaseUrl" error:**
Your `.env` has placeholder values. Replace them with real credentials from Supabase Settings > API.

**Android build fails with SDK not found:**
Open Android Studio > Settings > SDK Manager, install SDK 33+, and set `ANDROID_HOME` to the SDK path (typically `C:\Users\<you>\AppData\Local\Android\Sdk`).

**Android build fails with "Unsupported class file major version 69":**
Gradle 8.14.3 cannot run on Java 25 (Android Studio's bundled `jbr` on this machine). Set `JAVA_HOME` to the JDK 21 path (`C:\Users\DELL\.jdks\jbr-21.0.11`) as shown in Section 3.

**Gradle build hangs at the end (no BUILD SUCCESSFUL, log stops growing):**
A known Gradle daemon stall on Windows. Kill the java processes and rerun with `--no-daemon`.

**Voice input shows "not available" in the APK:**
The device has no speech recognition service. Install/update the Google app (it ships the speech service) and check that the device language pack for your chosen language is downloaded.

**Stale content after redeploying:**
The service worker caches assets. Open DevTools > Application > Service Workers > Unregister, then hard-refresh (Ctrl+Shift+R).
