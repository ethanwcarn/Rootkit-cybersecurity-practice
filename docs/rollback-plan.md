# Rollback Plan

## Trigger conditions

- Authentication failures above acceptable threshold.
- Breaking `401/403` behavior regression.
- Critical registration/login outage.
- Failed migration impacting read/write paths.

## Rollback steps

1. Stop new deployment traffic.
2. Revert to previous known-good build.
3. Restore previous app configuration and secrets references.
4. If schema changes are destructive, execute prepared DB rollback script.
5. Run smoke tests:
   - login/logout/me
   - admin policy route
   - catalog list endpoints
6. Communicate incident summary and root cause.
