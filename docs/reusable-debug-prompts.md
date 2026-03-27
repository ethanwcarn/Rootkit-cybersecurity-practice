# Reusable Debug Prompts

## API error triage

`Investigate failing auth endpoint behavior in backend/RootkitAuth.API. Focus on backend/RootkitAuth.API/Controllers/AuthController.cs, backend/RootkitAuth.API/Program.cs, and backend/RootkitAuth.API/Models/Auth/*.cs. Isolate whether failure is caused by validation, authentication, authorization, or serialization. Add/adjust ProblemDetails responses and fix root cause while preserving cookie auth and existing catalog endpoints.`

## Frontend route and redirect debugging

`Debug auth navigation issues in frontend/src/App.tsx, frontend/src/components/auth/ProtectedRoute.tsx, and frontend/src/pages/auth/*.tsx. Reproduce broken transitions (login redirect, callback route, unauthorized access), isolate route config mismatches, and implement minimal route fixes.`

## Auth state desync debugging

`Audit auth state transitions in frontend/src/context/AuthContext.tsx and frontend/src/lib/authApi.ts. Isolate why UI shows stale authenticated/anonymous state after login/logout/refresh, then fix bootstrap and action flow determinism.`

## Data contract drift debugging

`Compare backend auth responses from backend/RootkitAuth.API/Models/Auth/*.cs and controller outputs with frontend/src/types/auth.ts and frontend/src/lib/apiClient.ts usage. Identify field/casing/nullability mismatches and implement smallest safe alignment changes with tests.`

## 401 vs 403 debugging

`Inspect policy registration and usage in backend/RootkitAuth.API/Policies/AuthorizationPolicies.cs, backend/RootkitAuth.API/Program.cs, and protected controllers. Isolate incorrect 401/403 outcomes and fix middleware order, policy bindings, or auth scheme usage.`
