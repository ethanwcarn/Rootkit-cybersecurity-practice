# Security Baseline

## Cookie and session defaults

- Auth cookie is `HttpOnly`.
- `SameSite=Lax` by default for local development consistency.
- `SecurePolicy=SameAsRequest` for local HTTP/HTTPS compatibility; production should enforce HTTPS.

## CORS baseline

- Allowed origin is configured by `FrontendUrl`.
- Requests allow credentials and standard headers/methods.
- Wildcard origin with credentials is prohibited.

## Authorization baseline

- Middleware order is `UseAuthentication()` before `UseAuthorization()`.
- Policy names are centralized in `AuthorizationPolicies`.
- Admin-only routes require the `Admin` role.

## Sensitive data handling

- Never log raw passwords, tokens, secrets, or full MFA codes.
- Keep external provider client secrets in environment-secured configuration.

## Production hardening checklist

- Enforce HTTPS and secure cookies in production.
- Restrict Swagger to development/non-public environments.
- Validate redirect URIs for external providers.
