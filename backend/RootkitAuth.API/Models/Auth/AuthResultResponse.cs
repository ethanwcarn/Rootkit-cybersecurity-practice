namespace RootkitAuth.API.Models.Auth;

public class AuthResultResponse
{
    public bool Success { get; init; }
    public string Message { get; init; } = string.Empty;
    public AuthUserResponse? User { get; init; }
}
