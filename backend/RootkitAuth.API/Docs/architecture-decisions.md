# Architecture Decisions

## Authentication transport

- The project uses ASP.NET Core Identity with cookie authentication as the canonical auth transport.
- Browser clients call API endpoints with `credentials: "include"` so authentication cookies are sent on requests.
- JWT/localStorage authentication is intentionally out of scope for this architecture.

## API contract conventions

- Auth endpoints return typed response DTOs.
- Validation/auth errors return RFC 7807 `ProblemDetails`.
- Authorization semantics:
  - `401` when not authenticated.
  - `403` when authenticated but missing required policy/role.

## Frontend/backend boundary

- Frontend owns session rendering state and route-level guards.
- Backend owns identity checks, policy checks, and session issuance/termination.
- DTO names and fields are kept explicit to avoid API/frontend contract drift.

## Open questions

- TODO: finalize CSRF strategy for state-changing endpoints when adding non-auth form flows.
- TODO: confirm production cookie domain value for deployment environment.
