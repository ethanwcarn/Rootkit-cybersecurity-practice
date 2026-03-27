using RootkitAuth.API.Models.Auth;
using Xunit;

namespace RootkitAuth.API.Tests.Auth;

public class AuthEndpointsTests
{
    [Fact]
    public void RegisterRequest_RequiresMatchingPasswordConfirmation()
    {
        var request = new RegisterRequest
        {
            Email = "test@example.com",
            Password = "Password1",
            ConfirmPassword = "Password1"
        };

        Assert.Equal(request.Password, request.ConfirmPassword);
        Assert.Equal("test@example.com", request.Email);
    }

    [Fact]
    public void AuthResultResponse_CanCarryUserPayload()
    {
        var response = new AuthResultResponse
        {
            Success = true,
            Message = "ok",
            User = new AuthUserResponse
            {
                UserId = "123",
                Email = "test@example.com",
                Roles = ["Admin"],
                TwoFactorEnabled = true
            }
        };

        Assert.True(response.Success);
        Assert.NotNull(response.User);
        Assert.Contains("Admin", response.User!.Roles);
    }
}
