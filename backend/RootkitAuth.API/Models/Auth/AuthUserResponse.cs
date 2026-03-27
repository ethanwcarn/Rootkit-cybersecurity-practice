namespace RootkitAuth.API.Models.Auth;

public class AuthUserResponse
{
    public string UserId { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public string? DisplayName { get; init; }
    public string[] Roles { get; init; } = [];
    public bool TwoFactorEnabled { get; init; }
}
