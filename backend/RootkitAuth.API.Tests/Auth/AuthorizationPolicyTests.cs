using RootkitAuth.API.Policies;
using Xunit;

namespace RootkitAuth.API.Tests.Auth;

public class AuthorizationPolicyTests
{
    [Fact]
    public void PolicyConstants_AreStable()
    {
        Assert.Equal("RequireAuthenticated", AuthorizationPolicies.RequireAuthenticated);
        Assert.Equal("RequireAdmin", AuthorizationPolicies.RequireAdmin);
        Assert.Equal("Admin", AuthorizationPolicies.AdminRole);
    }
}
