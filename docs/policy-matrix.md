# Authorization Policy Matrix

## Policies

- `RequireAuthenticated`: user must be logged in.
- `RequireAdmin`: user must be logged in and have role `Admin`.

## Endpoint matrix

| Endpoint | Policy | Expected unauthenticated | Expected unauthorized role |
| --- | --- | --- | --- |
| `GET /api/rootbeers` | Public | `200` | `200` |
| `GET /api/rootbeers/containers` | Public | `200` | `200` |
| `GET /api/auth/me` | RequireAuthenticated | `401` | n/a |
| `POST /api/auth/logout` | RequireAuthenticated | `401` | n/a |
| `POST /api/auth/mfa/setup` | RequireAuthenticated | `401` | n/a |
| `POST /api/auth/mfa/verify` | RequireAuthenticated | `401` | n/a |
| `POST /api/auth/mfa/disable` | RequireAuthenticated | `401` | n/a |
| `GET /api/admin/users` | RequireAdmin | `401` | `403` |
