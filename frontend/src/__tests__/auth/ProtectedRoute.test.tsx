// Placeholder test artifact for protected-route behavior.
// Intended assertions when test runner is added:
// 1) anonymous users are redirected to /login
// 2) authenticated users can render child content
// 3) loading state renders fallback text

export const protectedRouteTestCases = [
  'redirect anonymous users',
  'render children for authenticated users',
  'show loading state while auth bootstrap is in progress',
];
