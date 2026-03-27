using System.Text;
using Microsoft.AspNetCore.Identity;
using RootkitAuth.API.Data;
using RootkitAuth.API.Models.Auth;

namespace RootkitAuth.API.Services.Auth;

public class MfaService(UserManager<ApplicationUser> userManager)
{
    public async Task<MfaSetupResponse> BuildSetupResponseAsync(ApplicationUser user)
    {
        var unformattedKey = await userManager.GetAuthenticatorKeyAsync(user);
        if (string.IsNullOrWhiteSpace(unformattedKey))
        {
            await userManager.ResetAuthenticatorKeyAsync(user);
            unformattedKey = await userManager.GetAuthenticatorKeyAsync(user);
        }

        unformattedKey ??= string.Empty;

        var encodedEmail = Uri.EscapeDataString(user.Email ?? "user");
        var issuer = Uri.EscapeDataString("RootkitAuth");
        var otpAuthUri = $"otpauth://totp/{issuer}:{encodedEmail}?secret={unformattedKey}&issuer={issuer}&digits=6";

        return new MfaSetupResponse
        {
            SharedKey = FormatKey(unformattedKey),
            AuthenticatorUri = otpAuthUri
        };
    }

    private static string FormatKey(string key)
    {
        var result = new StringBuilder();
        var currentPosition = 0;
        while (currentPosition + 4 < key.Length)
        {
            result.Append(key.AsSpan(currentPosition, 4)).Append(' ');
            currentPosition += 4;
        }

        if (currentPosition < key.Length)
        {
            result.Append(key.AsSpan(currentPosition));
        }

        return result.ToString().ToLowerInvariant();
    }
}
