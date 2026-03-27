# Configuration Guide

## Backend

- `ConnectionStrings:RootkitAuthConnection` - SQLite or production DB connection.
- `FrontendUrl` - allowed CORS origin for SPA.
- `Authentication:External:Google:ClientId` - external provider client id.
- `Authentication:External:Google:ClientSecret` - external provider client secret.

## Frontend

- `VITE_API_BASE_URL` (optional for non-proxy environments).

## Security defaults

- Cookie auth is the canonical auth transport.
- Frontend must send requests with `credentials: include`.
- `401` = unauthenticated, `403` = authenticated but forbidden.
