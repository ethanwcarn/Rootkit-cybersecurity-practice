# Debugging Playbook

## API errors

### Isolate

1. Reproduce endpoint in Swagger.
2. Compare payload to DTO model.
3. Confirm auth cookie and policy requirements.
4. Correlate frontend request with backend log entry.

### Fix

- Align controller responses to typed DTO and `ProblemDetails`.
- Add validation or guard clauses.
- Correct policy mapping and middleware order.

## Routing issues

### Isolate

1. Check route definitions in `frontend/src/App.tsx`.
2. Validate backend route attributes and callback route.
3. Test direct URL entry and in-app navigation.

### Fix

- Normalize route path constants and parameter naming.
- Add explicit callback/fallback route behavior.

## Auth state problems

### Isolate

1. Trace `AuthContext` startup (`me` request), login, logout.
2. Verify state transitions and error conditions.
3. Reproduce multi-tab and refresh behavior.

### Fix

- Centralize session state updates in context.
- Ensure logout clears local state even on server error.

## Data mismatches

### Isolate

1. Compare backend JSON fields with TypeScript interfaces.
2. Check nullability and casing mismatches.

### Fix

- Update DTOs and frontend parser usage in same change.
- Add regression tests for response shape.
