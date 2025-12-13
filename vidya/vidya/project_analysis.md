
 # ADTip React Native — Project & Bug Documentation

 This documentation is intended for new developers joining the project. It covers:
 - A high-level map of the codebase
 - Where key features live
 - A categorized list of known/likely bugs and risks
 - Where to find detailed bug/feature docs in `vidya/`

 ## 0. Project Structure (important)

 The actual React Native app lives under `Adtip/`.

 ```text
 adtip-reactnative/
   Adtip/                 <-- Main React Native application (TypeScript)
   src/                   <-- Smaller folder (appears legacy/secondary)
   docs/                  <-- Existing documentation
   dbschema1111/          <-- DB schema artifacts
   vidya/                 <-- This documentation set (only folder we modify)
 ```

 ## 1. Main Entry Points (Where the app starts)

 - **App entry**: `Adtip/App.tsx`
   - Initializes core providers and services
   - Handles killed-state notification/call recovery logic
   - Connects navigation container via `navigationRef`

 - **Navigation**:
   - `Adtip/src/navigation/MainNavigator.tsx` (main stack)
   - `Adtip/src/navigation/NavigationService.ts` (global navigation ref + helpers)
   - `Adtip/src/navigation/SimplifiedNavigationService.ts` (simplified meeting navigation)

 - **Auth & session**:
   - `Adtip/src/contexts/AuthContext.tsx`
     - session bootstrap (AsyncStorage + UserDataManager)
     - authenticated vs onboarding routing decisions

 - **API layer**:
   - `Adtip/src/services/ApiService.ts`
     - Axios client
     - request/response interceptors
     - token attachment

 - **Notifications / calls**:
   - `Adtip/src/services/notification/NotifeeCallHandler.tsx`
     - Notifee foreground/background event routing

 ## 2. Categories

 ### 2.1 Newly added / recently enhanced features

 - **Push Notifications + Call Handling**
   - **Docs**: `vidya/feature_docs/push_notifications.md`
   - **Key code**:
     - `Adtip/App.tsx` (killed-state handling)
     - `Adtip/src/services/notification/NotifeeCallHandler.tsx`

 - **Central API Integration (Axios ApiService)**
   - **Docs**: `vidya/feature_docs/api_integration.md`
   - **Key code**:
     - `Adtip/src/services/ApiService.ts`

 ### 2.2 Critical / Complex bugs (high impact, harder to fix)

 - **Possible event-listener duplication / memory/perf degradation risk**
   - **Docs**: `vidya/bug_reports/navigation_memory_leak.md`
   - **Why critical**: repeated handlers can cause duplicate navigation/actions and degrade performance over time.
   - **Key code**:
     - `Adtip/src/services/notification/NotifeeCallHandler.tsx` (`onForegroundEvent`, `onBackgroundEvent`)

 - **Auth token expiry / inconsistent token key usage**
   - **Docs**: `vidya/bug_reports/auth_token_expiry.md`
   - **Why critical**: session instability breaks most protected screens.
   - **Key code**:
     - `Adtip/src/services/ApiService.ts` (reads `accessToken` and `@auth_token`)
     - `Adtip/src/contexts/AuthContext.tsx` (session bootstrap via `userDataManager` and AsyncStorage)

 ### 2.3 Minor bugs (low/medium impact, straightforward)

 These are common issues to watch for during QA. They are not exhaustively confirmed yet.

 - **Over-logging / noisy console output**
   - `ApiService.ts` logs request headers and request data.
   - Risk: performance impact + potential sensitive data exposure.
   - Suggested: ensure tokens are not logged; prefer `ProductionLogger` with redaction.

 - **Inconsistent folder usage (`src/` vs `Adtip/src/`)**
   - Risk: new devs edit the wrong folder.
   - Suggested: clarify which folder is authoritative (currently `Adtip/`).

 ### 2.4 Technical debt / architecture risks

 - **Multiple navigation helpers**
   - `NavigationService.ts` and `SimplifiedNavigationService.ts` both exist.
   - Risk: split responsibility and subtle bugs depending on which helper is used.

 - **Large, complex `App.tsx`**
   - Many responsibilities in one file: initialization, killed-state routing, background service startup.
   - Risk: regressions and difficult testing.

 ## 3. Step-by-step for a new developer

 ### Step 1: Read onboarding
 - Start here: `vidya/onboarding.md`

 ### Step 2: Understand app startup
 - Read: `Adtip/App.tsx`
 - Focus on:
   - `AuthProvider` / `useAuth()` usage
   - service initialization sequence
   - killed-state call handling

 ### Step 3: Understand navigation
 - Read: `Adtip/src/navigation/MainNavigator.tsx`
 - Read: `Adtip/src/navigation/NavigationService.ts`

 ### Step 4: Understand API & auth
 - Read: `Adtip/src/services/ApiService.ts`
 - Read: `Adtip/src/contexts/AuthContext.tsx`

 ### Step 5: Review known bugs
 - `vidya/bug_reports/navigation_memory_leak.md`
 - `vidya/bug_reports/auth_token_expiry.md`

 ## 4. Documentation Index (vidya folder)

 - `vidya/project_analysis.md` (this file)
 - `vidya/onboarding.md`
 - `vidya/code_style_guide.md`
 - `vidya/bug_reports/navigation_memory_leak.md`
 - `vidya/bug_reports/auth_token_expiry.md`
 - `vidya/feature_docs/push_notifications.md`
 - `vidya/feature_docs/api_integration.md`

