namespace RootkitAuth.API.Models.Auth;

public class MfaSetupResponse
{
    public string SharedKey { get; init; } = string.Empty;
    public string AuthenticatorUri { get; init; } = string.Empty;
}
