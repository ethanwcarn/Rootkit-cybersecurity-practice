# Phase Milestones and Acceptance Criteria

## Milestone 1 - Foundation

- Identity services registered and authentication middleware active.
- Cookie transport confirmed with CORS credentials support.
- Auth DTO contracts present in backend/frontend.

## Milestone 2 - Auth Flows

- Register/login/logout/me endpoints operational.
- Frontend login/register flows update UI auth state correctly.
- Protected route redirects anonymous users to `/login`.

## Milestone 3 - Authorization + Advanced Auth

- Admin policy endpoint returns `403` for non-admin users.
- MFA setup/verify/disable routes return expected responses.
- External challenge/callback scaffolding available and configurable.

## Milestone 4 - Compliance + Quality

- Cookie consent UX active and persisted.
- Backend tests pass for auth contracts/policy constants.
- Debugging playbook, prompt pack, deployment, and rollback docs completed.
