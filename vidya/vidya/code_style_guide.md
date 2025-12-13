# ADTip React Native — Code Style Guide

## 1. Language and conventions
- Primary app is **TypeScript** (see `Adtip/`).
- Prefer **typed params/return types** over `any`.
- Keep imports at top of file.

## 2. File/feature organization
- Prefer feature-based grouping under `Adtip/src/`.
- Put shared services in `Adtip/src/services/`.
- Put shared navigation utilities in `Adtip/src/navigation/`.
- Put shared state in `Adtip/src/contexts/` or stores (e.g. `Adtip/src/stores/`).

## 3. React patterns
- Use `useEffect` cleanups for:
  - event listeners
  - intervals/timeouts
  - subscriptions
- Avoid setting state after unmount.

## 4. Logging
- Prefer `ProductionLogger` (`Logger.*`) over `console.log` for production paths.
- Do not log secrets:
  - tokens
  - OTP
  - personally identifiable user data

## 5. API & auth conventions
- Use a **single source of truth** for token storage keys.
- Handle `401` in a central place (Axios response interceptor) and trigger refresh/logout.

## 6. Formatting & linting (recommended)
This repo currently doesn’t show ESLint/Prettier config in root `package.json`. Recommended setup:
- Add ESLint with React Native + TypeScript configs
- Add Prettier
- Add `lint` and `format` scripts

Suggested scripts (example):
```json
{
  "scripts": {
    "lint": "eslint .",
    "format": "prettier --write ."
  }
}
```

## 7. Pull request checklist
- Ensure builds run on Android + iOS.
- Add/update documentation in `vidya/` when:
  - adding features
  - fixing bugs
  - changing API contracts
