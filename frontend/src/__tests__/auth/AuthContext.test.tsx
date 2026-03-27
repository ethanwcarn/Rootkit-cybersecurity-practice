import type { AuthUser } from '../../types/auth';

// Minimal contract-level checks without framework coupling.
export function authContextContractSmokeTest() {
  const sample: AuthUser = {
    userId: '1',
    email: 'sample@example.com',
    displayName: 'Sample',
    roles: ['User'],
    twoFactorEnabled: false,
  };

  console.assert(sample.email.includes('@'), 'AuthUser email must be valid');
  console.assert(
    Array.isArray(sample.roles),
    'AuthUser roles must be an array'
  );
}
