# Bug Report — Auth Token Expiry / Logout Instability

## Category
Critical / Complex bug

## Summary
The app appears to lack a robust **token refresh + 401 recovery flow**. As a result, users can be logged out unexpectedly or see failures when tokens expire.

## Code areas involved
- `Adtip/src/contexts/AuthContext.tsx`
- `Adtip/src/services/ApiService.ts`

## Observations in current code
### 1) Token storage keys are inconsistent
In `ApiService.ts` request interceptor:
- Reads `accessToken`
- Fallback reads `@auth_token`

In `AuthContext.tsx` initialization:
- checks session via `userDataManager.getCurrentUser()` and `sessionData.accessToken`
- also reads `AsyncStorage.getItem('user')`

This can lead to scenarios where:
- app thinks it is authenticated (has session data)
- but API requests send no/old token (wrong key)

### 2) No central refresh-on-401 mechanism
`ApiService.ts` shows interceptors for request/response logging, but (from the inspected snippet) there is no clear centralized:
- refresh token call
- queueing of pending requests during refresh
- forced logout on refresh failure

## Symptoms
- Requests suddenly fail after some time (401/403)
- User gets sent back to login/onboarding unexpectedly
- Some screens work, others fail (depending on which token key they rely on)

## Steps to reproduce
1. Login successfully.
2. Keep app open until server access token expires (or force expiry on backend).
3. Trigger a protected API request.
4. Observe:
   - 401
   - failure without recovery
   - user experience disruption

## Expected behavior
- When API returns `401`:
  - attempt refresh (if refresh token exists)
  - replay queued requests
  - logout only if refresh fails

## Actual behavior
- Likely no refresh/retry → user-facing failures.

## Recommended fix direction
- Establish a single token storage contract (one key name).
- Implement response interceptor logic:
  - detect `401`
  - refresh token once
  - queue/retry pending requests
  - on refresh failure: clear storage + navigate to auth

## Attachments to add
- API logs showing `401` for protected endpoint
- storage dump (keys present / missing)

## Notes
This bug is categorized as **Critical/Complex** because it affects session stability and core navigation flows.
