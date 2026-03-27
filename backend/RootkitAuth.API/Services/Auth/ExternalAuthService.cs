namespace RootkitAuth.API.Services.Auth;

public class ExternalAuthService(IConfiguration configuration)
{
    public bool IsProviderConfigured(string provider)
    {
        return !string.IsNullOrWhiteSpace(configuration[$"Authentication:External:{provider}:ClientId"])
            && !string.IsNullOrWhiteSpace(configuration[$"Authentication:External:{provider}:ClientSecret"]);
    }
}
