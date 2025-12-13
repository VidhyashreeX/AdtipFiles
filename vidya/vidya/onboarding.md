# ADTip React Native — Onboarding Guide

## 1. What this repo contains
- `Adtip/`: Main React Native application (TypeScript) — this is the real app source.
- `src/`: A small separate folder with `contexts/services/utils` (appears unused/legacy compared to `Adtip/src`).
- `dbschema1111/`: Database schema artifacts.
- `docs/`: Existing project docs.
- `vidya/`: This documentation set (bugs, features, onboarding).

## 2. Prerequisites
- Node.js + npm (use the version your team standardizes on)
- React Native environment set up:
  - Android Studio + SDKs
  - Xcode + CocoaPods (for iOS)

## 3. Install dependencies
From repo root (`adtip-reactnative`):

```bash
npm install
```

## 4. Run the app
### Android
```bash
npx react-native run-android
```

### iOS
```bash
cd Adtip/ios
pod install
cd ../..

npx react-native run-ios
```

## 5. Where to start reading the code
- **App entry**: `Adtip/App.tsx`
- **Auth state**: `Adtip/src/contexts/AuthContext.tsx`
- **Navigation**:
  - `Adtip/src/navigation/MainNavigator.tsx`
  - `Adtip/src/navigation/NavigationService.ts`
- **API**: `Adtip/src/services/ApiService.ts`
- **Notifications (Notifee)**: `Adtip/src/services/notification/NotifeeCallHandler.tsx`

## 6. Debug checklist (common)
- **If the app shows a blank loader**:
  - Check Auth initialization: `AuthContext.tsx` sets `isInitialized`.
  - Search for logs from `ProductionLogger`.
- **If API calls fail**:
  - Confirm `API_BASE_URL` in `Adtip/src/constants/api`.
  - Check `ApiService.ts` request interceptor token keys.
- **If call/notification flows fail**:
  - Check Notifee handlers and app killed-state handling in `Adtip/App.tsx`.

## 7. Documentation map
- Bugs: `vidya/bug_reports/`
- Feature docs: `vidya/feature_docs/`
- Code style guide: `vidya/code_style_guide.md`
- Project analysis: `vidya/project_analysis.md`
