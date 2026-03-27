# Test Plan

## Automated checks

- Backend auth contract tests:
  - `register/login/logout/me`
  - `401` vs `403` policy behavior
  - `ProblemDetails` structure on failures
- Frontend auth tests:
  - auth bootstrap state
  - protected-route redirects
  - auth state transitions on login/logout

## Manual checks

1. Register a new account and verify immediate authenticated state.
2. Log out and confirm protected routes redirect to `/login`.
3. Attempt admin endpoint without role and verify `403`.
4. Enable MFA with setup code, verify code flow, then disable MFA.
5. Confirm catalog endpoints still load for anonymous users.
6. Verify cookie consent banner behavior and persistence.

## Debug checklist

- If `/api/auth/me` returns `401` unexpectedly:
  - verify cookie attributes, CORS origin, and `credentials: include`.
- If `[Authorize]` seems ignored:
  - verify `UseAuthentication()` is called before `UseAuthorization()`.
- If external auth callback fails:
  - verify provider client id/secret and callback URL configuration.
