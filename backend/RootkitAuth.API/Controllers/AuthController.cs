using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using RootkitAuth.API.Data;
using RootkitAuth.API.Models.Auth;
using RootkitAuth.API.Policies;
using RootkitAuth.API.Services.Auth;

namespace RootkitAuth.API.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AuthController(
    UserManager<ApplicationUser> userManager,
    SignInManager<ApplicationUser> signInManager,
    MfaService mfaService,
    ExternalAuthService externalAuthService) : ControllerBase
{
    /// <summary>
    /// Registers a new user account.
    /// </summary>
    [HttpPost("register")]
    public async Task<ActionResult<AuthResultResponse>> Register([FromBody] RegisterRequest request)
    {
        var existingUser = await userManager.FindByEmailAsync(request.Email);
        if (existingUser is not null)
        {
            return Conflict(CreateProblem("Email already exists.", StatusCodes.Status409Conflict));
        }

        var user = new ApplicationUser
        {
            UserName = request.Email,
            Email = request.Email,
            DisplayName = request.DisplayName
        };

        var createResult = await userManager.CreateAsync(user, request.Password);
        if (!createResult.Succeeded)
        {
            return BadRequest(CreateProblem(
                "Registration failed.",
                StatusCodes.Status400BadRequest,
                createResult.Errors.Select(error => error.Description).ToArray()));
        }

        await signInManager.SignInAsync(user, isPersistent: false);

        return StatusCode(StatusCodes.Status201Created, new AuthResultResponse
        {
            Success = true,
            Message = "Registration successful.",
            User = await ToAuthUserResponseAsync(user)
        });
    }

    /// <summary>
    /// Signs in an existing user with email/password.
    /// </summary>
    [HttpPost("login")]
    public async Task<ActionResult<AuthResultResponse>> Login([FromBody] LoginRequest request)
    {
        var user = await userManager.FindByEmailAsync(request.Email);
        if (user is null)
        {
            return Unauthorized(CreateProblem("Invalid credentials.", StatusCodes.Status401Unauthorized));
        }

        var result = await signInManager.PasswordSignInAsync(
            user,
            request.Password,
            request.RememberMe,
            lockoutOnFailure: true);

        if (result.RequiresTwoFactor)
        {
            return Unauthorized(CreateProblem(
                "Two-factor authentication is required for this account.",
                StatusCodes.Status401Unauthorized));
        }

        if (result.IsLockedOut)
        {
            return StatusCode(StatusCodes.Status423Locked, CreateProblem(
                "Account is locked due to too many failed attempts.",
                StatusCodes.Status423Locked));
        }

        if (!result.Succeeded)
        {
            return Unauthorized(CreateProblem("Invalid credentials.", StatusCodes.Status401Unauthorized));
        }

        return Ok(new AuthResultResponse
        {
            Success = true,
            Message = "Login successful.",
            User = await ToAuthUserResponseAsync(user)
        });
    }

    /// <summary>
    /// Signs out the current user.
    /// </summary>
    [HttpPost("logout")]
    [Authorize(Policy = AuthorizationPolicies.RequireAuthenticated)]
    public async Task<ActionResult<AuthResultResponse>> Logout()
    {
        await signInManager.SignOutAsync();
        return Ok(new AuthResultResponse
        {
            Success = true,
            Message = "Logout successful."
        });
    }

    /// <summary>
    /// Returns the currently authenticated user.
    /// </summary>
    [HttpGet("me")]
    [Authorize(Policy = AuthorizationPolicies.RequireAuthenticated)]
    public async Task<ActionResult<AuthUserResponse>> Me()
    {
        var user = await userManager.GetUserAsync(User);
        if (user is null)
        {
            return Unauthorized(CreateProblem("Not authenticated.", StatusCodes.Status401Unauthorized));
        }

        return Ok(await ToAuthUserResponseAsync(user));
    }

    [HttpPost("mfa/setup")]
    [Authorize(Policy = AuthorizationPolicies.RequireAuthenticated)]
    public async Task<ActionResult<MfaSetupResponse>> SetupMfa()
    {
        var user = await userManager.GetUserAsync(User);
        if (user is null)
        {
            return Unauthorized(CreateProblem("Not authenticated.", StatusCodes.Status401Unauthorized));
        }

        var setup = await mfaService.BuildSetupResponseAsync(user);
        return Ok(setup);
    }

    [HttpPost("mfa/verify")]
    [Authorize(Policy = AuthorizationPolicies.RequireAuthenticated)]
    public async Task<ActionResult<AuthResultResponse>> VerifyMfa([FromBody] MfaVerifyRequest request)
    {
        var user = await userManager.GetUserAsync(User);
        if (user is null)
        {
            return Unauthorized(CreateProblem("Not authenticated.", StatusCodes.Status401Unauthorized));
        }

        var verificationCode = request.Code.Replace(" ", string.Empty).Replace("-", string.Empty);
        var valid = await userManager.VerifyTwoFactorTokenAsync(
            user,
            userManager.Options.Tokens.AuthenticatorTokenProvider,
            verificationCode);

        if (!valid)
        {
            return BadRequest(CreateProblem("Invalid MFA code.", StatusCodes.Status400BadRequest));
        }

        await userManager.SetTwoFactorEnabledAsync(user, true);
        return Ok(new AuthResultResponse
        {
            Success = true,
            Message = "MFA enabled.",
            User = await ToAuthUserResponseAsync(user)
        });
    }

    [HttpPost("mfa/disable")]
    [Authorize(Policy = AuthorizationPolicies.RequireAuthenticated)]
    public async Task<ActionResult<AuthResultResponse>> DisableMfa()
    {
        var user = await userManager.GetUserAsync(User);
        if (user is null)
        {
            return Unauthorized(CreateProblem("Not authenticated.", StatusCodes.Status401Unauthorized));
        }

        await userManager.SetTwoFactorEnabledAsync(user, false);
        await userManager.ResetAuthenticatorKeyAsync(user);

        return Ok(new AuthResultResponse
        {
            Success = true,
            Message = "MFA disabled.",
            User = await ToAuthUserResponseAsync(user)
        });
    }

    [HttpGet("external/{provider}/challenge")]
    public IActionResult ExternalChallenge([FromRoute] string provider, [FromQuery] string? returnUrl = null)
    {
        if (!externalAuthService.IsProviderConfigured(provider))
        {
            return BadRequest(CreateProblem(
                $"External provider '{provider}' is not configured.",
                StatusCodes.Status400BadRequest));
        }

        var callbackUrl = Url.ActionLink(
            nameof(ExternalCallback),
            values: new { provider, returnUrl = returnUrl ?? "/" });

        if (string.IsNullOrWhiteSpace(callbackUrl))
        {
            return BadRequest(CreateProblem("Unable to generate callback URL.", StatusCodes.Status400BadRequest));
        }

        var properties = signInManager.ConfigureExternalAuthenticationProperties(provider, callbackUrl);
        return Challenge(properties, provider);
    }

    [HttpGet("external/providers")]
    public ActionResult<IEnumerable<string>> ExternalProviders()
    {
        var configuredProviders = new List<string>();
        if (externalAuthService.IsProviderConfigured("Google"))
        {
            configuredProviders.Add("Google");
        }

        return Ok(configuredProviders);
    }

    [HttpGet("external/{provider}/callback")]
    public async Task<ActionResult<AuthResultResponse>> ExternalCallback([FromRoute] string provider, [FromQuery] string? returnUrl = "/")
    {
        var info = await signInManager.GetExternalLoginInfoAsync();
        if (info is null)
        {
            return BadRequest(CreateProblem("External login info is unavailable.", StatusCodes.Status400BadRequest));
        }

        var signInResult = await signInManager.ExternalLoginSignInAsync(
            info.LoginProvider,
            info.ProviderKey,
            isPersistent: false,
            bypassTwoFactor: true);

        ApplicationUser? user = null;

        if (signInResult.Succeeded)
        {
            user = await userManager.FindByLoginAsync(info.LoginProvider, info.ProviderKey);
        }
        else
        {
            var email = info.Principal.FindFirstValue(ClaimTypes.Email);
            if (string.IsNullOrWhiteSpace(email))
            {
                return BadRequest(CreateProblem("External account did not provide an email.", StatusCodes.Status400BadRequest));
            }

            user = await userManager.FindByEmailAsync(email);
            if (user is null)
            {
                user = new ApplicationUser
                {
                    UserName = email,
                    Email = email,
                    DisplayName = info.Principal.Identity?.Name
                };

                var createUserResult = await userManager.CreateAsync(user);
                if (!createUserResult.Succeeded)
                {
                    return BadRequest(CreateProblem(
                        "Unable to create local account for external login.",
                        StatusCodes.Status400BadRequest,
                        createUserResult.Errors.Select(error => error.Description).ToArray()));
                }
            }

            var addLoginResult = await userManager.AddLoginAsync(user, info);
            if (!addLoginResult.Succeeded)
            {
                return BadRequest(CreateProblem(
                    "Unable to link external login.",
                    StatusCodes.Status400BadRequest,
                    addLoginResult.Errors.Select(error => error.Description).ToArray()));
            }

            await signInManager.SignInAsync(user, isPersistent: false);
        }

        return Ok(new AuthResultResponse
        {
            Success = true,
            Message = "External login successful.",
            User = user is null ? null : await ToAuthUserResponseAsync(user)
        });
    }

    private ProblemDetails CreateProblem(string detail, int statusCode, string[]? errors = null)
    {
        var problem = new ProblemDetails
        {
            Title = "Authentication error",
            Detail = detail,
            Status = statusCode,
            Type = $"https://httpstatuses.com/{statusCode}"
        };

        if (errors is { Length: > 0 })
        {
            problem.Extensions["errors"] = errors;
        }

        return problem;
    }

    private async Task<AuthUserResponse> ToAuthUserResponseAsync(ApplicationUser user)
    {
        var roles = await userManager.GetRolesAsync(user);
        return new AuthUserResponse
        {
            UserId = user.Id,
            Email = user.Email ?? string.Empty,
            DisplayName = user.DisplayName,
            Roles = roles.ToArray(),
            TwoFactorEnabled = user.TwoFactorEnabled
        };
    }
}
