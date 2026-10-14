# DentCare Frontend - Authentication Strategy Decision

## Decision: Backend-Managed Session (JWT in HttpOnly Cookie)

**Status**: Approved for Implementation  
**Date**: 2026-10-14  
**Deciders**: Frontend Team, Backend Team, Security Review

---

## Options Considered

| Approach | Description | Pros | Cons |
|----------|-------------|------|------|
| **Supabase Auth (Client-Side)** | Browser uses `@supabase/supabase-js` directly; JWT in localStorage/memory | Zero backend auth code; built-in OAuth, MFA, email confirm | Service role key never in browser; but requires Supabase project; vendor lock-in; limited custom claims; token refresh in browser |
| **Backend-Managed Session (Chosen)** | Python API issues/sits JWT; HttpOnly Secure cookie; frontend calls `/auth/login`, `/auth/refresh` | Full control over claims, revocation, audit; works with any DB; no vendor lock-in; secure by default (HttpOnly); easier SSO integration later | More backend code; need token refresh logic in frontend; CSRF protection needed |

---

## Chosen Architecture

```
┌─────────────────┐     HTTPS      ┌──────────────────┐
│   Browser       │◄──────────────►│  Python API      │
│  (React + Vite) │  JWT in Cookie │  (FastAPI/Flask) │
└─────────────────┘                └──────────────────┘
        ▲                                    │
        │                                    ▼
        │                          ┌──────────────────┐
        │                          │  PostgreSQL      │
        │                          │  (Supabase/Neon) │
        │                          └──────────────────┘
        │
        ▼
┌─────────────────┐
│  HttpOnly Cookie │  (Secure, SameSite=Lax)
│  access_token    │
│  refresh_token   │
└─────────────────┘
```

### Token Flow

1. **Login** → `POST /api/v1/auth/login` → Sets `access_token` (15 min) + `refresh_token` (30 days) as HttpOnly cookies
2. **Authenticated Requests** → Cookie sent automatically; API validates access token
3. **Token Refresh** → `POST /api/v1/auth/refresh` (uses refresh cookie) → New access token cookie
4. **Logout** → `POST /api/v1/auth/logout` → Clears both cookies

### Security Measures

- **HttpOnly + Secure + SameSite=Lax** cookies (prevents XSS theft)
- **CSRF Protection**: Double-submit cookie pattern or `SameSite=Strict` for state-changing endpoints
- **Short-lived access tokens** (15 min) with automatic refresh
- **Refresh token rotation** (optional) + reuse detection
- **Token revocation** on logout/password change/role change via Redis blocklist
- **CORS** restricted to known frontend origin(s)

---

## Frontend Integration Points

### API Client (`src/services/api/client.ts`)
- Automatic cookie handling (credentials: 'include')
- Silent token refresh on 401 via `/auth/refresh`
- Redirect to `/login` on refresh failure

### Auth Service (`src/services/api/ApiAuthService.ts`)
```typescript
login(email, password) → User
logout() → void
getProfile() → User
registerPatient(data) → Patient
```

### React Hooks (`src/services/api/hooks.ts`)
```typescript
useAuth() → { user, login, logout, loading }
useUserProfile() → UserProfile
```

### Protected Routes
- Wrapper component checks `auth.user` before rendering
- Redirects to `/login?next=...` if unauthenticated

---

## Environment Variables

```env
# Frontend (.env)
VITE_API_BASE_URL=https://api.dentcare.example.com/api/v1
VITE_APP_URL=https://app.dentcare.example.com

# Backend (.env)
JWT_SECRET_KEY=... (32+ bytes, rotated quarterly)
JWT_ALGORITHM=HS256
ACCESS_TOKEN_TTL_MINUTES=15
REFRESH_TOKEN_TTL_DAYS=30
COOKIE_DOMAIN=.dentcare.example.com
COOKIE_SECURE=true
COOKIE_SAME_SITE=lax
CORS_ORIGINS=https://app.dentcare.example.com
REDIS_URL=redis://... (for token blocklist)
```

---

## Migration Path from Current `localStorage` Auth

| Current | Target |
|---------|--------|
| `localStorage.setItem('dentcare_active_user', ...)` | HttpOnly cookies |
| `store.ts` `setActiveUser()` | `authStore.setUser(user)` (memory only) |
| Role switcher in Navbar | Removed (DEV only) |
| `resetToSeed()` in Navbar | Removed (DEV only) |

---

## Supabase Usage (Database Only)

| Feature | Usage |
|---------|-------|
| **Auth** | NOT used — backend manages sessions |
| **Database** | PostgreSQL via Supabase/Neon connection pooling |
| **Storage** | Optional — for document uploads (X-rays, receipts) |
| **Realtime** | Optional — for live queue updates (WebSocket fallback) |
| **Edge Functions** | NOT used — all logic in Python API |

---

## Rollout Plan

1. **Week 1**: Backend implements `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/profile`
2. **Week 2**: Frontend switches `apiClient` to `credentials: 'include'`; removes `localStorage` tokens
3. **Week 3**: Add CSRF protection; test token refresh edge cases
4. **Week 4**: Security review; penetration test; deploy to staging
5. **Week 5**: Production deploy with monitoring (failed refresh rate, 401 spikes)

---

## References

- [OWASP JWT Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_Cheat_Sheet.html)
- [OWASP Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [RFC 6265 - HttpOnly Cookies](https://tools.ietf.org/html/rfc6265)
- [FastAPI Security Docs](https://fastapi.tiangolo.com/tutorial/security/)