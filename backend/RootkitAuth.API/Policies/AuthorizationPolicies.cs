namespace RootkitAuth.API.Policies;

public static class AuthorizationPolicies
{
    public const string RequireAuthenticated = "RequireAuthenticated";
    public const string RequireAdmin = "RequireAdmin";
    public const string AdminRole = "Admin";
}
