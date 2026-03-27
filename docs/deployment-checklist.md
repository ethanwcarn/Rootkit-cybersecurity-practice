# Deployment Checklist

- [ ] Configure production `FrontendUrl`.
- [ ] Set secure external auth secrets via environment variables.
- [ ] Confirm DB connection string for production environment.
- [ ] Run EF migrations before traffic cutover.
- [ ] Ensure Swagger is disabled outside development.
- [ ] Confirm HTTPS and secure cookie policies are enforced.
- [ ] Run post-deploy smoke tests:
  - register/login/logout/me
  - protected admin endpoint policy checks
  - catalog endpoint availability
  - MFA setup/verify endpoint behavior
