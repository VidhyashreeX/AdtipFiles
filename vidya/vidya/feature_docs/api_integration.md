# Feature Documentation — API Integration (Axios ApiService)

## Category
Core feature / platform service

## Key file
- `Adtip/src/services/ApiService.ts`

## Purpose
Provide a central HTTP client that:
- sets base URL
- sets JSON headers
- attaches auth token for protected endpoints
- logs network activity

## Current behavior (based on inspected code)
### Axios client configuration
- `baseURL: API_BASE_URL`
- `timeout: 60000`

### Request interceptor
- Determines whether endpoint is public (`PUBLIC_ENDPOINTS` match) or guest mode.
- If protected:
  - reads token from `AsyncStorage.getItem('accessToken')`
  - fallback: `AsyncStorage.getItem('@auth_token')`
  - sets `Authorization: Bearer <token>`

### Response interceptor
- Logs response via `ProductionLogger`.

## How to use in code
Most screens/services should call API through `ApiService` methods instead of using raw `fetch`.

## Known risks / related bug docs
- See `vidya/bug_reports/auth_token_expiry.md` for token key inconsistency and missing refresh strategy.

## Recommended improvements (future)
- Add a token refresh / retry mechanism on `401`.
- Avoid logging full request headers in production if they may contain tokens.
- Standardize token storage key.
