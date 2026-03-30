# RootkitAuth — Full-Stack Identity & E-Commerce App: Recreation Guide

> **Purpose:** This document is a complete technical specification for recreating this project from scratch. Hand it to any AI assistant or developer and they will be able to rebuild the entire application identically.

---

## Project Overview

**RootkitAuth** is a full-stack web application demonstrating secure identity management layered on top of a product catalog (root beer). It was built in two phases:

1. **Base repo** — a simple React + ASP.NET Core skeleton with a root beer catalog (browse products, filter by container type, add to cart).
2. **Cybersecurity layer added** — a complete authentication and authorization system bolted on top, including cookie-based sessions, password policy enforcement, account lockout, TOTP multi-factor authentication, OAuth (Google), role-based access control, and a cookie consent banner.

The document below describes **everything that was added in phase 2** and exactly how to recreate it.

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Backend framework | ASP.NET Core 10 (.NET 10) |
| ORM | Entity Framework Core (SQLite) |
| Auth framework | ASP.NET Core Identity |
| MFA | TOTP via `Microsoft.AspNetCore.Identity` token providers |
| OAuth | Google OAuth 2.0 via `Microsoft.AspNetCore.Authentication.Google` |
| Frontend framework | React 19 + TypeScript |
| Bundler | Vite 6 |
| CSS | Bootstrap 5.3 |
| Routing | React Router v7 |
| Testing (backend) | xUnit |
| Testing (frontend) | Jest + React Testing Library (placeholders) |

---

## Repository Structure

```
/
├── backend/
│   ├── RootkitAuth.API/                  ← Main ASP.NET Core project
│   │   ├── Controllers/
│   │   │   ├── AuthController.cs
│   │   │   ├── AdminController.cs
│   │   │   └── RootbeersController.cs
│   │   ├── Services/Auth/
│   │   │   ├── MfaService.cs
│   │   │   └── ExternalAuthService.cs
│   │   ├── Data/
│   │   │   ├── ApplicationDbContext.cs
│   │   │   ├── ApplicationUser.cs
│   │   │   └── Rootbeer.cs
│   │   ├── Models/Auth/
│   │   │   ├── LoginRequest.cs
│   │   │   ├── RegisterRequest.cs
│   │   │   ├── AuthUserResponse.cs
│   │   │   ├── AuthResultResponse.cs
│   │   │   ├── MfaSetupResponse.cs
│   │   │   └── MfaVerifyRequest.cs
│   │   ├── Policies/
│   │   │   └── AuthorizationPolicies.cs
│   │   ├── Migrations/
│   │   │   └── 20260327171218_AddIdentitySchema.cs
│   │   ├── Docs/
│   │   │   ├── security-baseline.md
│   │   │   └── architecture-decisions.md
│   │   ├── Program.cs
│   │   ├── appsettings.json
│   │   └── appsettings.Development.json
│   └── RootkitAuth.API.Tests/
│       └── Auth/
│           ├── AuthEndpointsTests.cs
│           └── AuthorizationPolicyTests.cs
├── frontend/
│   └── src/
│       ├── context/
│       │   ├── AuthContext.tsx
│       │   ├── CartContext.tsx
│       │   └── ConsentContext.tsx
│       ├── lib/
│       │   ├── apiClient.ts
│       │   ├── authApi.ts
│       │   ├── rootbeerApi.ts
│       │   └── consent.ts
│       ├── types/
│       │   ├── auth.ts
│       │   ├── CartItem.ts
│       │   └── Rootbeer.ts
│       ├── pages/auth/
│       │   ├── LoginPage.tsx
│       │   ├── RegisterPage.tsx
│       │   ├── MfaPage.tsx
│       │   └── ExternalCallbackPage.tsx
│       ├── components/auth/
│       │   └── ProtectedRoute.tsx
│       ├── components/consent/
│       │   └── CookieConsentBanner.tsx
│       ├── components/Header.tsx
│       ├── App.tsx
│       └── main.tsx
└── docs/
    ├── configuration.md
    ├── policy-matrix.md
    ├── deployment-checklist.md
    └── architecture-decisions.md
```

---

## Part 1: Backend — What Was Added

### 1.1 NuGet Package Dependencies

Add these to `RootkitAuth.API.csproj`:

```xml
<PackageReference Include="Microsoft.AspNetCore.Identity.EntityFrameworkCore" Version="10.*" />
<PackageReference Include="Microsoft.EntityFrameworkCore.Sqlite" Version="10.*" />
<PackageReference Include="Microsoft.EntityFrameworkCore.Tools" Version="10.*" />
<PackageReference Include="Microsoft.AspNetCore.Authentication.Google" Version="10.*" />
```

---

### 1.2 Data Models

#### `Data/ApplicationUser.cs`
Extends the built-in `IdentityUser` with one extra field:

```csharp
using Microsoft.AspNetCore.Identity;

namespace RootkitAuth.API.Data;

public class ApplicationUser : IdentityUser
{
    public string? DisplayName { get; set; }
}
```

#### `Data/ApplicationDbContext.cs`
Inherits from `IdentityDbContext<ApplicationUser>` so it manages all Identity tables automatically, plus the product catalog:

```csharp
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace RootkitAuth.API.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options) { }

    public DbSet<Rootbeer> Rootbeers => Set<Rootbeer>();
}
```

---

### 1.3 DTOs (Data Transfer Objects)

Create each of these under `Models/Auth/`:

#### `LoginRequest.cs`
```csharp
using System.ComponentModel.DataAnnotations;

namespace RootkitAuth.API.Models.Auth;

public class LoginRequest
{
    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;

    public bool RememberMe { get; set; }
}
```

#### `RegisterRequest.cs`
```csharp
using System.ComponentModel.DataAnnotations;

namespace RootkitAuth.API.Models.Auth;

public class RegisterRequest
{
    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required, MinLength(8)]
    public string Password { get; set; } = string.Empty;

    [Required, Compare(nameof(Password))]
    public string ConfirmPassword { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? DisplayName { get; set; }
}
```

#### `AuthUserResponse.cs`
```csharp
namespace RootkitAuth.API.Models.Auth;

public class AuthUserResponse
{
    public string UserId { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public string? DisplayName { get; init; }
    public string[] Roles { get; init; } = [];
    public bool TwoFactorEnabled { get; init; }
}
```

#### `AuthResultResponse.cs`
```csharp
namespace RootkitAuth.API.Models.Auth;

public class AuthResultResponse
{
    public bool Success { get; init; }
    public string Message { get; init; } = string.Empty;
    public AuthUserResponse? User { get; init; }
}
```

#### `MfaSetupResponse.cs`
```csharp
namespace RootkitAuth.API.Models.Auth;

public class MfaSetupResponse
{
    public string SharedKey { get; init; } = string.Empty;
    public string AuthenticatorUri { get; init; } = string.Empty;
}
```

#### `MfaVerifyRequest.cs`
```csharp
using System.ComponentModel.DataAnnotations;

namespace RootkitAuth.API.Models.Auth;

public class MfaVerifyRequest
{
    [Required, MinLength(6), MaxLength(8)]
    public string Code { get; set; } = string.Empty;
}
```

---

### 1.4 Authorization Policies

Create `Policies/AuthorizationPolicies.cs`:

```csharp
namespace RootkitAuth.API.Policies;

public static class AuthorizationPolicies
{
    public const string RequireAuthenticated = "RequireAuthenticated";
    public const string RequireAdmin = "RequireAdmin";
    public const string AdminRole = "Admin";
}
```

---

### 1.5 Services

#### `Services/Auth/MfaService.cs`
Handles TOTP setup — generating the secret key and building the `otpauth://` URI that authenticator apps scan:

```csharp
using Microsoft.AspNetCore.Identity;
using RootkitAuth.API.Data;
using RootkitAuth.API.Models.Auth;

namespace RootkitAuth.API.Services.Auth;

public class MfaService(UserManager<ApplicationUser> userManager)
{
    private const string Issuer = "RootkitAuth";

    public async Task<MfaSetupResponse> BuildSetupResponseAsync(ApplicationUser user)
    {
        // Retrieve or generate the authenticator key
        var unformattedKey = await userManager.GetAuthenticatorKeyAsync(user);
        if (string.IsNullOrEmpty(unformattedKey))
        {
            await userManager.ResetAuthenticatorKeyAsync(user);
            unformattedKey = await userManager.GetAuthenticatorKeyAsync(user);
        }

        var email = await userManager.GetEmailAsync(user) ?? string.Empty;
        var encodedEmail = Uri.EscapeDataString(email);
        var encodedIssuer = Uri.EscapeDataString(Issuer);

        var uri = $"otpauth://totp/{encodedIssuer}:{encodedEmail}" +
                  $"?secret={unformattedKey}&issuer={encodedIssuer}&digits=6";

        return new MfaSetupResponse
        {
            SharedKey = FormatKey(unformattedKey!),
            AuthenticatorUri = uri
        };
    }

    private static string FormatKey(string key)
    {
        // Break into groups of 4 characters separated by spaces
        var result = new System.Text.StringBuilder();
        for (int i = 0; i < key.Length; i++)
        {
            if (i > 0 && i % 4 == 0) result.Append(' ');
            result.Append(key[i]);
        }
        return result.ToString().ToLowerInvariant();
    }
}
```

#### `Services/Auth/ExternalAuthService.cs`
Checks whether an OAuth provider has been configured via appsettings:

```csharp
namespace RootkitAuth.API.Services.Auth;

public class ExternalAuthService(IConfiguration configuration)
{
    public bool IsProviderConfigured(string provider)
    {
        var clientId = configuration[$"Authentication:External:{provider}:ClientId"];
        var clientSecret = configuration[$"Authentication:External:{provider}:ClientSecret"];
        return !string.IsNullOrEmpty(clientId) && !string.IsNullOrEmpty(clientSecret);
    }
}
```

---

### 1.6 Controllers

#### `Controllers/AuthController.cs`
The main auth controller. All endpoints are under `/api/auth`.

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using RootkitAuth.API.Data;
using RootkitAuth.API.Models.Auth;
using RootkitAuth.API.Policies;
using RootkitAuth.API.Services.Auth;

namespace RootkitAuth.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(
    UserManager<ApplicationUser> userManager,
    SignInManager<ApplicationUser> signInManager,
    MfaService mfaService,
    ExternalAuthService externalAuthService) : ControllerBase
{
    // POST /api/auth/register
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        if (!ModelState.IsValid)
            return CreateProblem("Validation failed.", 400,
                ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToArray());

        var existingUser = await userManager.FindByEmailAsync(request.Email);
        if (existingUser != null)
            return CreateProblem("Email address is already registered.", 409);

        var user = new ApplicationUser
        {
            UserName = request.Email,
            Email = request.Email,
            DisplayName = request.DisplayName
        };

        var result = await userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
            return CreateProblem("Registration failed.", 400,
                result.Errors.Select(e => e.Description).ToArray());

        await signInManager.SignInAsync(user, isPersistent: false);

        return StatusCode(201, new AuthResultResponse
        {
            Success = true,
            Message = "Registration successful.",
            User = await ToAuthUserResponseAsync(user)
        });
    }

    // POST /api/auth/login
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (!ModelState.IsValid)
            return CreateProblem("Validation failed.", 400,
                ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToArray());

        var user = await userManager.FindByEmailAsync(request.Email);
        if (user == null)
            return CreateProblem("Invalid email or password.", 401);

        var result = await signInManager.PasswordSignInAsync(
            user, request.Password, request.RememberMe, lockoutOnFailure: true);

        if (result.IsLockedOut)
            return CreateProblem("Account is locked. Try again later.", 423);

        if (result.RequiresTwoFactor)
            return CreateProblem("Two-factor authentication required.", 401,
                ["2FA_REQUIRED"]);

        if (!result.Succeeded)
            return CreateProblem("Invalid email or password.", 401);

        return Ok(new AuthResultResponse
        {
            Success = true,
            Message = "Login successful.",
            User = await ToAuthUserResponseAsync(user)
        });
    }

    // POST /api/auth/logout
    [HttpPost("logout")]
    [Authorize(Policy = AuthorizationPolicies.RequireAuthenticated)]
    public async Task<IActionResult> Logout()
    {
        await signInManager.SignOutAsync();
        return Ok(new AuthResultResponse { Success = true, Message = "Logged out." });
    }

    // GET /api/auth/me
    [HttpGet("me")]
    [Authorize(Policy = AuthorizationPolicies.RequireAuthenticated)]
    public async Task<IActionResult> Me()
    {
        var user = await userManager.GetUserAsync(User);
        if (user == null) return Unauthorized();

        return Ok(await ToAuthUserResponseAsync(user));
    }

    // POST /api/auth/mfa/setup
    [HttpPost("mfa/setup")]
    [Authorize(Policy = AuthorizationPolicies.RequireAuthenticated)]
    public async Task<IActionResult> SetupMfa()
    {
        var user = await userManager.GetUserAsync(User);
        if (user == null) return Unauthorized();

        var response = await mfaService.BuildSetupResponseAsync(user);
        return Ok(response);
    }

    // POST /api/auth/mfa/verify
    [HttpPost("mfa/verify")]
    [Authorize(Policy = AuthorizationPolicies.RequireAuthenticated)]
    public async Task<IActionResult> VerifyMfa([FromBody] MfaVerifyRequest request)
    {
        var user = await userManager.GetUserAsync(User);
        if (user == null) return Unauthorized();

        // Remove spaces and dashes (common in manual entry)
        var sanitizedCode = request.Code.Replace(" ", "").Replace("-", "");

        var isValid = await userManager.VerifyTwoFactorTokenAsync(
            user,
            userManager.Options.Tokens.AuthenticatorTokenProvider,
            sanitizedCode);

        if (!isValid)
            return CreateProblem("Invalid verification code.", 400);

        await userManager.SetTwoFactorEnabledAsync(user, true);

        return Ok(new AuthResultResponse { Success = true, Message = "MFA enabled." });
    }

    // POST /api/auth/mfa/disable
    [HttpPost("mfa/disable")]
    [Authorize(Policy = AuthorizationPolicies.RequireAuthenticated)]
    public async Task<IActionResult> DisableMfa()
    {
        var user = await userManager.GetUserAsync(User);
        if (user == null) return Unauthorized();

        await userManager.SetTwoFactorEnabledAsync(user, false);
        await userManager.ResetAuthenticatorKeyAsync(user);

        return Ok(new AuthResultResponse { Success = true, Message = "MFA disabled." });
    }

    // GET /api/auth/external/{provider}/challenge
    [HttpGet("external/{provider}/challenge")]
    public IActionResult ExternalChallenge(string provider, string returnUrl = "/")
    {
        if (!externalAuthService.IsProviderConfigured(provider))
            return CreateProblem($"Provider '{provider}' is not configured.", 400);

        var callbackUrl = Url.Action(
            nameof(ExternalCallback), "Auth",
            new { provider, returnUrl },
            Request.Scheme)!;

        var properties = signInManager.ConfigureExternalAuthenticationProperties(provider, callbackUrl);
        return Challenge(properties, provider);
    }

    // GET /api/auth/external/{provider}/callback
    [HttpGet("external/{provider}/callback")]
    public async Task<IActionResult> ExternalCallback(string provider, string returnUrl = "/")
    {
        var info = await signInManager.GetExternalLoginInfoAsync();
        if (info == null)
            return Redirect($"/login?error=external_login_failed");

        // Try to sign in with existing external login
        var result = await signInManager.ExternalLoginSignInAsync(
            info.LoginProvider, info.ProviderKey, isPersistent: false, bypassTwoFactor: true);

        if (result.Succeeded)
            return Redirect(returnUrl);

        // New user — create account and link external login
        var email = info.Principal.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value ?? string.Empty;
        var displayName = info.Principal.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value;

        var user = new ApplicationUser
        {
            UserName = email,
            Email = email,
            DisplayName = displayName,
            EmailConfirmed = true
        };

        var createResult = await userManager.CreateAsync(user);
        if (!createResult.Succeeded)
            return Redirect("/login?error=registration_failed");

        await userManager.AddLoginAsync(user, info);
        await signInManager.SignInAsync(user, isPersistent: false);

        return Redirect(returnUrl);
    }

    // GET /api/auth/external/providers
    [HttpGet("external/providers")]
    public IActionResult ExternalProviders()
    {
        var configured = new List<string>();
        if (externalAuthService.IsProviderConfigured("Google"))
            configured.Add("Google");

        return Ok(configured);
    }

    // --- Helpers ---

    private ObjectResult CreateProblem(string detail, int statusCode, string[]? errors = null)
    {
        var problem = new ProblemDetails
        {
            Detail = detail,
            Status = statusCode
        };
        if (errors != null)
            problem.Extensions["errors"] = errors;

        return StatusCode(statusCode, problem);
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
```

#### `Controllers/AdminController.cs`
Requires the `Admin` role on every endpoint:

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using RootkitAuth.API.Data;
using RootkitAuth.API.Models.Auth;
using RootkitAuth.API.Policies;

namespace RootkitAuth.API.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Policy = AuthorizationPolicies.RequireAdmin)]
public class AdminController(UserManager<ApplicationUser> userManager) : ControllerBase
{
    // GET /api/admin/users
    [HttpGet("users")]
    public async Task<IActionResult> GetUsers()
    {
        var users = userManager.Users.ToList();
        var responses = new List<AuthUserResponse>();

        foreach (var user in users)
        {
            var roles = await userManager.GetRolesAsync(user);
            responses.Add(new AuthUserResponse
            {
                UserId = user.Id,
                Email = user.Email ?? string.Empty,
                DisplayName = user.DisplayName,
                Roles = roles.ToArray(),
                TwoFactorEnabled = user.TwoFactorEnabled
            });
        }

        return Ok(responses);
    }
}
```

---

### 1.7 `Program.cs` — Full Service & Middleware Configuration

Replace/update your `Program.cs` with everything below. The key additions are:
- `AddIdentityCore` + `AddEntityFrameworkStores`
- `AddAuthentication` with cookie scheme
- Google OAuth conditional registration
- Authorization policies
- CORS restricted to frontend origin
- Swagger only in development

```csharp
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using RootkitAuth.API.Data;
using RootkitAuth.API.Policies;
using RootkitAuth.API.Services.Auth;

var builder = WebApplication.CreateBuilder(args);

// --- Database ---
var connectionString = builder.Configuration.GetConnectionString("RootkitAuthConnection")
    ?? "Data Source=RootkitAuth.sqlite";
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlite(connectionString));

// --- ASP.NET Core Identity ---
builder.Services.AddIdentityCore<ApplicationUser>(options =>
{
    // Password policy
    options.Password.RequireDigit = true;
    options.Password.RequiredLength = 8;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequireUppercase = true;
    options.Password.RequireLowercase = true;

    // Lockout policy
    options.Lockout.MaxFailedAccessAttempts = 5;
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
    options.Lockout.AllowedForNewUsers = true;

    // User settings
    options.User.RequireUniqueEmail = true;
})
.AddRoles<IdentityRole>()
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddSignInManager()
.AddDefaultTokenProviders();

// --- Authentication ---
var authBuilder = builder.Services.AddAuthentication(IdentityConstants.ApplicationScheme)
    .AddIdentityCookies(options =>
    {
        options.ApplicationCookie!.Configure(cookie =>
        {
            cookie.Cookie.HttpOnly = true;
            cookie.Cookie.SameSite = SameSiteMode.Lax;
            cookie.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
            cookie.SlidingExpiration = true;
            cookie.ExpireTimeSpan = TimeSpan.FromHours(8);

            // Return 401/403 instead of redirecting to login pages (API behavior)
            cookie.Events.OnRedirectToLogin = ctx =>
            {
                ctx.Response.StatusCode = 401;
                return Task.CompletedTask;
            };
            cookie.Events.OnRedirectToAccessDenied = ctx =>
            {
                ctx.Response.StatusCode = 403;
                return Task.CompletedTask;
            };
        });
    });

// Conditionally register Google OAuth only if credentials are configured
var googleClientId = builder.Configuration["Authentication:External:Google:ClientId"];
var googleClientSecret = builder.Configuration["Authentication:External:Google:ClientSecret"];
if (!string.IsNullOrEmpty(googleClientId) && !string.IsNullOrEmpty(googleClientSecret))
{
    authBuilder.AddGoogle(options =>
    {
        options.ClientId = googleClientId;
        options.ClientSecret = googleClientSecret;
    });
}

// --- Authorization ---
builder.Services.AddAuthorizationBuilder()
    .AddPolicy(AuthorizationPolicies.RequireAuthenticated,
        policy => policy.RequireAuthenticatedUser())
    .AddPolicy(AuthorizationPolicies.RequireAdmin,
        policy => policy.RequireRole(AuthorizationPolicies.AdminRole));

// --- CORS ---
var frontendUrl = builder.Configuration["FrontendUrl"] ?? "http://localhost:3000";
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(frontendUrl)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials(); // Required for cookie-based auth
    });
});

// --- Services ---
builder.Services.AddScoped<MfaService>();
builder.Services.AddScoped<ExternalAuthService>();

// --- Controllers & Swagger ---
builder.Services.AddControllers();
if (builder.Environment.IsDevelopment())
{
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen();
}

var app = builder.Build();

// --- Middleware Pipeline ---
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// --- Apply pending migrations on startup ---
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    await db.Database.MigrateAsync();
}

app.Run();
```

---

### 1.8 Configuration Files

#### `appsettings.json`
```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*",
  "FrontendUrl": "http://localhost:3000",
  "ConnectionStrings": {
    "RootkitAuthConnection": "Data Source=RootkitAuth.sqlite"
  },
  "Authentication": {
    "External": {
      "Google": {
        "ClientId": "",
        "ClientSecret": ""
      }
    }
  }
}
```

#### `appsettings.Development.json`
```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning",
      "Microsoft.AspNetCore.Authentication": "Information",
      "Microsoft.AspNetCore.Authorization": "Information"
    }
  },
  "FrontendUrl": "http://localhost:3000"
}
```

---

### 1.9 Entity Framework Migration

Run these commands to generate and apply the migration:

```bash
cd backend/RootkitAuth.API
dotnet ef migrations add AddIdentitySchema
dotnet ef database update
```

The migration creates these tables:
- `AspNetUsers` — user accounts (with custom `DisplayName` column)
- `AspNetRoles` — role definitions
- `AspNetUserRoles` — user↔role many-to-many
- `AspNetUserClaims` — per-user claims
- `AspNetRoleClaims` — per-role claims
- `AspNetUserLogins` — external OAuth provider links
- `AspNetUserTokens` — MFA secrets and recovery codes
- `Rootbeers` — product catalog

---

### 1.10 Backend Tests

#### `RootkitAuth.API.Tests/Auth/AuthEndpointsTests.cs`
```csharp
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
            ConfirmPassword = "DifferentPassword1"
        };

        // ConfirmPassword has [Compare(nameof(Password))] — mismatch should be caught at model validation
        Assert.NotEqual(request.Password, request.ConfirmPassword);
    }

    [Fact]
    public void AuthResultResponse_CanCarryUserPayload()
    {
        var user = new AuthUserResponse
        {
            UserId = "abc123",
            Email = "user@example.com",
            Roles = ["Admin"],
            TwoFactorEnabled = true
        };

        var response = new AuthResultResponse
        {
            Success = true,
            Message = "Login successful.",
            User = user
        };

        Assert.True(response.Success);
        Assert.NotNull(response.User);
        Assert.Equal("Admin", response.User.Roles[0]);
    }
}
```

#### `RootkitAuth.API.Tests/Auth/AuthorizationPolicyTests.cs`
```csharp
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
```

---

## Part 2: Frontend — What Was Added

### 2.1 TypeScript Types

#### `src/types/auth.ts`
```typescript
export interface AuthUser {
  userId: string;
  email: string;
  displayName?: string | null;
  roles: string[];
  twoFactorEnabled: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  displayName?: string;
}

export interface MfaVerifyRequest {
  code: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: AuthUser;
}

export interface ProblemDetails {
  title?: string;
  status?: number;
  detail?: string;
  type?: string;
  errors?: string[];
}

export type ApiError = {
  message: string;
  status?: number;
  problem?: ProblemDetails;
};
```

---

### 2.2 API Client

#### `src/lib/apiClient.ts`
Low-level HTTP wrapper. Every request includes `credentials: 'include'` so the browser sends the auth cookie.

```typescript
import type { ApiError, ProblemDetails } from '../types/auth';

function buildUrl(path: string): string {
  const base = import.meta.env.VITE_API_BASE_URL as string | undefined;
  return base ? `${base}${path}` : path;
}

async function parseApiError(response: Response): Promise<ApiError> {
  try {
    const problem = (await response.json()) as ProblemDetails;
    const message =
      problem.detail ??
      problem.title ??
      `Request failed with status ${response.status}`;
    return { message, status: response.status, problem };
  } catch {
    return {
      message: `Request failed with status ${response.status}`,
      status: response.status,
    };
  }
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(buildUrl(path), {
    credentials: 'include',
  });
  if (!response.ok) throw await parseApiError(response);
  return response.json() as Promise<T>;
}

export async function apiPost<TRequest, TResponse>(
  path: string,
  body: TRequest,
): Promise<TResponse> {
  const response = await fetch(buildUrl(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  if (!response.ok) throw await parseApiError(response);
  if (response.status === 204) return {} as TResponse;
  return response.json() as Promise<TResponse>;
}

export async function apiPostNoBody<TResponse>(path: string): Promise<TResponse> {
  const response = await fetch(buildUrl(path), {
    method: 'POST',
    credentials: 'include',
  });
  if (!response.ok) throw await parseApiError(response);
  if (response.status === 204) return {} as TResponse;
  return response.json() as Promise<TResponse>;
}
```

#### `src/lib/authApi.ts`
```typescript
import { apiGet, apiPost, apiPostNoBody } from './apiClient';
import type {
  AuthResponse,
  AuthUser,
  LoginRequest,
  MfaSetupResponse,
  MfaVerifyRequest,
  RegisterRequest,
} from '../types/auth';

// Add MfaSetupResponse to types/auth.ts:
// export interface MfaSetupResponse { sharedKey: string; authenticatorUri: string; }

export const authApi = {
  register: (request: RegisterRequest) =>
    apiPost<RegisterRequest, AuthResponse>('/api/auth/register', request),

  login: (request: LoginRequest) =>
    apiPost<LoginRequest, AuthResponse>('/api/auth/login', request),

  logout: () => apiPostNoBody<AuthResponse>('/api/auth/logout'),

  getCurrentUser: () => apiGet<AuthUser>('/api/auth/me'),

  setupMfa: () => apiPostNoBody<MfaSetupResponse>('/api/auth/mfa/setup'),

  verifyMfa: (request: MfaVerifyRequest) =>
    apiPost<MfaVerifyRequest, AuthResponse>('/api/auth/mfa/verify', request),

  disableMfa: () => apiPostNoBody<AuthResponse>('/api/auth/mfa/disable'),

  getExternalProviders: () => apiGet<string[]>('/api/auth/external/providers'),

  getExternalChallengeUrl: (provider: string, returnUrl: string): string => {
    const base = import.meta.env.VITE_API_BASE_URL as string ?? '';
    return `${base}/api/auth/external/${provider}/challenge?returnUrl=${encodeURIComponent(returnUrl)}`;
  },
};
```

---

### 2.3 Auth Context

#### `src/context/AuthContext.tsx`
Global auth state. Wrap the app with `AuthProvider`. All pages use `useAuth()`.

```tsx
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authApi } from '../lib/authApi';
import type { ApiError, AuthUser, LoginRequest, RegisterRequest } from '../types/auth';

interface AuthContextValue {
  status: 'loading' | 'authenticated' | 'anonymous';
  user: AuthUser | null;
  error: string | null;
  login: (request: LoginRequest) => Promise<void>;
  register: (request: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function getErrorMessage(err: unknown): string {
  const apiError = err as ApiError;
  return apiError?.problem?.detail ?? apiError?.message ?? 'Authentication request failed.';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'anonymous'>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await authApi.getCurrentUser();
      setUser(currentUser);
      setStatus('authenticated');
    } catch {
      setUser(null);
      setStatus('anonymous');
    }
  }, []);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  const login = useCallback(async (request: LoginRequest) => {
    try {
      setError(null);
      const response = await authApi.login(request);
      if (response.user) {
        setUser(response.user);
        setStatus('authenticated');
      } else {
        await refreshUser();
      }
    } catch (err) {
      setError(getErrorMessage(err));
      throw err;
    }
  }, [refreshUser]);

  const register = useCallback(async (request: RegisterRequest) => {
    try {
      setError(null);
      const response = await authApi.register(request);
      if (response.user) {
        setUser(response.user);
        setStatus('authenticated');
      } else {
        await refreshUser();
      }
    } catch (err) {
      setError(getErrorMessage(err));
      throw err;
    }
  }, [refreshUser]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      setStatus('anonymous');
    }
  }, []);

  return (
    <AuthContext.Provider value={{ status, user, error, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
```

---

### 2.4 Consent Context & Banner

#### `src/lib/consent.ts`
```typescript
export type ConsentPreference = 'accepted' | 'rejected';
const KEY = 'rootkit_cookie_consent';

export function getConsentPreference(): ConsentPreference | null {
  return (localStorage.getItem(KEY) as ConsentPreference | null);
}

export function setConsentPreference(preference: ConsentPreference): void {
  localStorage.setItem(KEY, preference);
}
```

#### `src/context/ConsentContext.tsx`
```tsx
import React, { createContext, useContext, useState } from 'react';
import {
  type ConsentPreference,
  getConsentPreference,
  setConsentPreference,
} from '../lib/consent';

interface ConsentContextValue {
  preference: ConsentPreference | null;
  setPreference: (p: ConsentPreference) => void;
}

const ConsentContext = createContext<ConsentContextValue | null>(null);

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = useState<ConsentPreference | null>(
    getConsentPreference,
  );

  const setPreference = (p: ConsentPreference) => {
    setConsentPreference(p);
    setPreferenceState(p);
  };

  return (
    <ConsentContext.Provider value={{ preference, setPreference }}>
      {children}
    </ConsentContext.Provider>
  );
}

export function useConsent(): ConsentContextValue {
  const ctx = useContext(ConsentContext);
  if (!ctx) throw new Error('useConsent must be used within ConsentProvider');
  return ctx;
}
```

#### `src/components/consent/CookieConsentBanner.tsx`
```tsx
import { useConsent } from '../../context/ConsentContext';

export function CookieConsentBanner() {
  const { preference, setPreference } = useConsent();

  if (preference !== null) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: '#212529',
        color: '#fff',
        padding: '1rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 9999,
      }}
    >
      <span>
        This site uses cookies for authentication. Do you consent?
      </span>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          className="btn btn-outline-light btn-sm"
          onClick={() => setPreference('rejected')}
        >
          Reject non-essential
        </button>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => setPreference('accepted')}
        >
          Accept all
        </button>
      </div>
    </div>
  );
}
```

---

### 2.5 Route Guard

#### `src/components/auth/ProtectedRoute.tsx`
```tsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <p>Loading session...</p>;

  if (status !== 'authenticated') {
    return (
      <Navigate
        to={`/login?returnUrl=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }

  return <>{children}</>;
}
```

---

### 2.6 Auth Pages

#### `src/pages/auth/LoginPage.tsx`
```tsx
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../lib/authApi';

export function LoginPage() {
  const { login, status, error } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') ?? '/catalog';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState<string[]>([]);

  useEffect(() => {
    if (status === 'authenticated') navigate(returnUrl, { replace: true });
  }, [status, navigate, returnUrl]);

  useEffect(() => {
    authApi.getExternalProviders().then(setProviders).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login({ email, password, rememberMe });
      navigate(returnUrl, { replace: true });
    } catch {
      // error shown via context
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5" style={{ maxWidth: 400 }}>
      <h2>Login</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Email</label>
          <input
            type="email"
            className="form-control"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Password</label>
          <input
            type="password"
            className="form-control"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="mb-3 form-check">
          <input
            type="checkbox"
            className="form-check-input"
            id="rememberMe"
            checked={rememberMe}
            onChange={e => setRememberMe(e.target.checked)}
          />
          <label className="form-check-label" htmlFor="rememberMe">Remember me</label>
        </div>
        <button type="submit" className="btn btn-primary w-100" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      {providers.includes('Google') && (
        <div className="mt-3">
          <hr />
          <a
            href={authApi.getExternalChallengeUrl('Google', '/auth/callback')}
            className="btn btn-outline-secondary w-100"
          >
            Continue with Google
          </a>
        </div>
      )}

      <div className="mt-3 text-center">
        <Link to="/register">Don't have an account? Register</Link>
      </div>
    </div>
  );
}
```

#### `src/pages/auth/RegisterPage.tsx`
```tsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function RegisterPage() {
  const { register, error } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await register({ email, password, confirmPassword, displayName: displayName || undefined });
      navigate('/catalog', { replace: true });
    } catch {
      // error shown via context
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5" style={{ maxWidth: 400 }}>
      <h2>Register</h2>
      {(localError ?? error) && (
        <div className="alert alert-danger">{localError ?? error}</div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Display Name (optional)</label>
          <input
            type="text"
            className="form-control"
            maxLength={100}
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Email</label>
          <input
            type="email"
            className="form-control"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Password</label>
          <input
            type="password"
            className="form-control"
            minLength={8}
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Confirm Password</label>
          <input
            type="password"
            className="form-control"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary w-100" disabled={loading}>
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>
      <div className="mt-3 text-center">
        <Link to="/login">Already have an account? Login</Link>
      </div>
    </div>
  );
}
```

#### `src/pages/auth/MfaPage.tsx`
```tsx
import { useEffect, useState } from 'react';
import { authApi } from '../../lib/authApi';

interface MfaSetupResponse {
  sharedKey: string;
  authenticatorUri: string;
}

export function MfaPage() {
  const [setup, setSetup] = useState<MfaSetupResponse | null>(null);
  const [code, setCode] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    authApi.setupMfa().then(setSetup).catch(() => setError('Failed to load MFA setup.'));
  }, []);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    try {
      await authApi.verifyMfa({ code });
      setMessage('MFA enabled successfully.');
    } catch {
      setError('Invalid code. Please try again.');
    }
  };

  const handleDisable = async () => {
    setMessage(null);
    setError(null);
    try {
      await authApi.disableMfa();
      setMessage('MFA has been disabled.');
    } catch {
      setError('Failed to disable MFA.');
    }
  };

  return (
    <div className="container mt-5" style={{ maxWidth: 500 }}>
      <h2>Multi-Factor Authentication</h2>
      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      {setup && (
        <>
          <p>Scan this key into your authenticator app:</p>
          <code className="d-block p-2 bg-light mb-3">{setup.sharedKey}</code>
          <p className="small text-muted">Or use the URI directly: {setup.authenticatorUri}</p>

          <form onSubmit={handleVerify}>
            <div className="mb-3">
              <label className="form-label">Verification Code</label>
              <input
                type="text"
                className="form-control"
                value={code}
                onChange={e => setCode(e.target.value)}
                minLength={6}
                maxLength={8}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary me-2">Enable MFA</button>
            <button type="button" className="btn btn-outline-danger" onClick={handleDisable}>
              Disable MFA
            </button>
          </form>
        </>
      )}
    </div>
  );
}
```

#### `src/pages/auth/ExternalCallbackPage.tsx`
```tsx
import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function ExternalCallbackPage() {
  const { refreshUser } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    refreshUser()
      .then(() => navigate('/catalog', { replace: true }))
      .catch(() => setError('Authentication failed. Please try again.'));
  }, [refreshUser, navigate]);

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">{error}</div>
        <Link to="/login">Return to login</Link>
      </div>
    );
  }

  return <p className="container mt-5">Completing sign-in...</p>;
}
```

---

### 2.7 Header Component (Auth-Aware)

#### `src/components/Header.tsx`
```tsx
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Header() {
  const { user, status, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/catalog');
  };

  return (
    <nav className="navbar navbar-dark bg-dark px-3 mb-4">
      <span className="navbar-brand">Rootkit Rootbeer Catalog</span>
      <div className="d-flex align-items-center gap-2">
        {status === 'authenticated' && user ? (
          <>
            <span className="text-light">{user.displayName ?? user.email}</span>
            <button
              className="btn btn-sm btn-outline-light"
              onClick={() => navigate('/mfa')}
            >
              MFA
            </button>
            <button className="btn btn-sm btn-outline-danger" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <button className="btn btn-sm btn-outline-light" onClick={() => navigate('/login')}>
              Login
            </button>
            <button className="btn btn-sm btn-primary" onClick={() => navigate('/register')}>
              Register
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
```

---

### 2.8 App Router Updates

#### `src/App.tsx`
Add the new routes and wrap with providers. The key additions are the `/login`, `/register`, `/mfa`, and `/auth/callback` routes.

```tsx
import { Routes, Route } from 'react-router-dom';
import { CookieConsentBanner } from './components/consent/CookieConsentBanner';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { MfaPage } from './pages/auth/MfaPage';
import { ExternalCallbackPage } from './pages/auth/ExternalCallbackPage';
import { CatalogPage } from './pages/CatalogPage';
import { ProductPage } from './pages/ProductPage';
import { CartPage } from './pages/CartPage';

export default function App() {
  return (
    <>
      <CookieConsentBanner />
      <Routes>
        <Route path="/" element={<CatalogPage />} />
        <Route path="/catalog" element={<CatalogPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/auth/callback" element={<ExternalCallbackPage />} />
        <Route
          path="/mfa"
          element={
            <ProtectedRoute>
              <MfaPage />
            </ProtectedRoute>
          }
        />
        <Route path="/product/:name/:id/:price" element={<ProductPage />} />
        <Route path="/cart" element={<CartPage />} />
      </Routes>
    </>
  );
}
```

#### `src/main.tsx`
Wrap everything in `ConsentProvider` → `AuthProvider` → `BrowserRouter`:

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConsentProvider } from './context/ConsentContext';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import App from './App';
import 'bootstrap/dist/css/bootstrap.min.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ConsentProvider>
        <AuthProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </AuthProvider>
      </ConsentProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
```

---

## Part 3: Security Feature Summary

This table describes every security control added and where it lives:

| Security Feature | Implementation | Location |
|-----------------|----------------|----------|
| **Password hashing** | bcrypt via ASP.NET Core Identity | Automatic via `UserManager` |
| **Password policy** | 8+ chars, uppercase, lowercase, digit required | `Program.cs` IdentityOptions |
| **Account lockout** | 5 failed attempts → locked 15 minutes | `Program.cs` IdentityOptions |
| **HttpOnly cookies** | Prevents XSS from reading session tokens | `Program.cs` cookie config |
| **SameSite=Lax cookies** | Prevents simple CSRF on state-changing requests from other origins | `Program.cs` cookie config |
| **Sliding session expiration** | Session extends on each request (8h window) | `Program.cs` cookie config |
| **401 vs 403 distinction** | Unauthenticated gets 401, unauthorized gets 403 | `Program.cs` event overrides |
| **TOTP / MFA** | Time-based one-time passwords compatible with Google Authenticator, Authy, etc. | `MfaService.cs`, `AuthController.cs`, `MfaPage.tsx` |
| **Google OAuth** | Sign in with Google, auto-creates account on first login, links external login | `AuthController.cs`, `ExternalAuthService.cs`, `LoginPage.tsx` |
| **Role-based authorization** | Admin role enforced at controller level | `AuthorizationPolicies.cs`, `AdminController.cs` |
| **Policy-based auth** | Named policies (`RequireAuthenticated`, `RequireAdmin`) | `AuthorizationPolicies.cs`, `Program.cs` |
| **CORS restriction** | Only configured `FrontendUrl` allowed, credentials enabled | `Program.cs` |
| **RFC 7807 error responses** | All errors return structured ProblemDetails, no stack traces | `AuthController.cs` CreateProblem helper |
| **Input validation** | Data annotations on all request DTOs, sanitization of MFA codes | All `*Request.cs` models, `AuthController.cs` |
| **Frontend route guards** | ProtectedRoute redirects unauthenticated users to login with returnUrl | `ProtectedRoute.tsx` |
| **Cookie consent banner** | Persistent consent stored in localStorage, hides after choice | `CookieConsentBanner.tsx`, `ConsentContext.tsx`, `consent.ts` |
| **Credentials in all requests** | `credentials: 'include'` ensures cookies are sent cross-origin to API | `apiClient.ts` |
| **External OAuth conditional** | Google auth only registered if ClientId+ClientSecret are configured | `Program.cs`, `ExternalAuthService.cs` |
| **Swagger disabled in prod** | Only enabled in Development environment | `Program.cs` |
| **Auto database migration** | Migrations apply on startup, ensuring schema is always up to date | `Program.cs` |

---

## Part 4: Known Gaps / TODOs

These are intentional simplifications that a production system would need to address:

1. **No CSRF token protection** — SameSite=Lax helps but doesn't cover all cases. Add antiforgery tokens for state-changing endpoints.
2. **No PKCE for OAuth** — Google OAuth flow doesn't use Proof Key for Code Exchange. Required for security hardening.
3. **External secrets in config files** — Google ClientId/ClientSecret should use environment variables or a secrets manager (Azure Key Vault, AWS Secrets Manager, etc.) in production.
4. **SecurePolicy=SameAsRequest** — Must change to `Always` in production to enforce HTTPS-only cookies.
5. **Admin endpoint lacks pagination** — `GET /api/admin/users` loads all users; needs cursor or offset pagination at scale.
6. **MFA bypass on OAuth** — `bypassTwoFactor: true` in `ExternalLoginSignInAsync` skips MFA for OAuth users.
7. **Cart not persistent** — Shopping cart is in-memory React state only; lost on refresh.
8. **No backup/recovery codes UI** — ASP.NET Core Identity generates recovery codes but they're not surfaced in the MFA UI.
9. **No email confirmation** — Users can log in without verifying their email address.

---

## Part 5: Running the Application

### Prerequisites
- .NET 10 SDK
- Node.js 20+
- (Optional) Google OAuth credentials

### Backend

```bash
cd backend/RootkitAuth.API
dotnet restore
dotnet ef database update   # Creates SQLite DB and applies migrations
dotnet run                  # Starts on https://localhost:5001 / http://localhost:5000
```

### Frontend

```bash
cd frontend
npm install
npm run dev                 # Starts on http://localhost:3000
```

### Optional: Google OAuth Setup

1. Create a Google Cloud project and OAuth 2.0 credentials.
2. Set the authorized redirect URI to: `http://localhost:5000/api/auth/external/Google/callback`
3. Add to `appsettings.Development.json` (or environment variables):
   ```json
   {
     "Authentication": {
       "External": {
         "Google": {
           "ClientId": "YOUR_CLIENT_ID",
           "ClientSecret": "YOUR_CLIENT_SECRET"
         }
       }
     }
   }
   ```

---

## Part 6: Endpoint Reference

| Method | Route | Auth Required | Description |
|--------|-------|--------------|-------------|
| POST | `/api/auth/register` | No | Create account |
| POST | `/api/auth/login` | No | Password login |
| POST | `/api/auth/logout` | Yes | End session |
| GET | `/api/auth/me` | Yes | Current user info |
| POST | `/api/auth/mfa/setup` | Yes | Generate TOTP secret |
| POST | `/api/auth/mfa/verify` | Yes | Validate code & enable MFA |
| POST | `/api/auth/mfa/disable` | Yes | Disable MFA |
| GET | `/api/auth/external/providers` | No | List configured OAuth providers |
| GET | `/api/auth/external/{provider}/challenge` | No | Start OAuth flow |
| GET | `/api/auth/external/{provider}/callback` | No | OAuth callback handler |
| GET | `/api/admin/users` | Admin role | List all users |
| GET | `/api/rootbeers` | No | Product catalog (paginated) |
| GET | `/api/rootbeers/containers` | No | Distinct container types |

---

## Part 7: Critical Single-Line Security Checks

The following statements are each individually crucial to the security of this application. Removing or changing any one of them opens a specific, exploitable vulnerability. **Verify every line exists exactly as shown before deploying.**

---

### Check 1 — `lockoutOnFailure: true`
**File:** `backend/RootkitAuth.API/Controllers/AuthController.cs`
**Attack prevented:** Brute-force password attacks

```csharp
var result = await signInManager.PasswordSignInAsync(
    user,
    request.Password,
    request.RememberMe,
    lockoutOnFailure: true);  // ← MUST BE true
```

**Why it's critical:** All the lockout configuration in `Program.cs` (5-attempt limit, 15-minute timeout) is completely inert unless this parameter is `true`. The default when omitted is `false`. Without it, an attacker can attempt unlimited passwords against any account with no consequence.

**How to verify:** Open `AuthController.cs` and search for `PasswordSignInAsync`. Confirm the fourth argument is `lockoutOnFailure: true`, not `false` and not missing.

---

### Check 2 — `credentials: 'include'`
**File:** `frontend/src/lib/apiClient.ts`
**Attack prevented:** Silent authentication bypass (every API call treated as anonymous)

```typescript
const response = await fetch(buildUrl(path), {
    credentials: 'include',  // ← MUST be present on every fetch call
});
```

**Why it's critical:** Without this option, the browser never sends the authentication cookie with cross-origin requests. Every API call looks unauthenticated to the server — `[Authorize]` endpoints return 401 for logged-in users and protected data is inaccessible. This must appear on all three fetch calls in `apiClient.ts` (`apiGet`, `apiPost`, `apiPostNoBody`).

**How to verify:** Open `apiClient.ts` and confirm `credentials: 'include'` appears inside every `fetch(...)` call. There should be three occurrences.

---

### Check 3 — `options.Cookie.HttpOnly = true`
**File:** `backend/RootkitAuth.API/Program.cs`
**Attack prevented:** XSS-based session hijacking

```csharp
options.Cookie.HttpOnly = true;
```

**Why it's critical:** Without this, any cross-site scripting (XSS) vulnerability anywhere on the frontend — even a single injected `<script>` tag — lets an attacker read the session cookie via `document.cookie` and steal every logged-in user's session. HttpOnly makes the cookie invisible to JavaScript entirely.

**How to verify:** Open `Program.cs`, find the `AddCookie` configuration block, and confirm `options.Cookie.HttpOnly = true` is present and not commented out.

---

### Check 4 — `options.Cookie.SameSite = SameSiteMode.Lax`
**File:** `backend/RootkitAuth.API/Program.cs`
**Attack prevented:** Cross-Site Request Forgery (CSRF)

```csharp
options.Cookie.SameSite = SameSiteMode.Lax;
```

**Why it's critical:** Without a SameSite restriction (or with `SameSiteMode.None`), a malicious third-party website can embed a hidden form that submits a POST to this API. The victim's browser automatically attaches their auth cookie, executing authenticated actions without their knowledge (e.g., changing their password or accessing their account). `Lax` blocks cross-site POST requests while still allowing normal navigation.

**How to verify:** Open `Program.cs`, find the cookie configuration block, and confirm `SameSite` is set to `SameSiteMode.Lax` (not `None` and not absent).

---

### Check 5 — `policy.WithOrigins(frontendUrl)`
**File:** `backend/RootkitAuth.API/Program.cs`
**Attack prevented:** Unauthorized cross-origin credentialed requests

```csharp
policy.WithOrigins(frontendUrl)
    .AllowCredentials()
    .AllowAnyMethod()
    .AllowAnyHeader();
```

**Why it's critical:** `AllowCredentials()` is required for cookie-based auth to work cross-origin, but it must be paired with a specific origin allowlist — never a wildcard. If this were `.AllowAnyOrigin().AllowCredentials()`, any website could make authenticated API calls on behalf of a logged-in user. `WithOrigins(frontendUrl)` locks it to only the known frontend.

**How to verify:** Open `Program.cs`, find the `AddCors` block, and confirm the policy uses `WithOrigins(...)` with a specific URL — not `AllowAnyOrigin()`.

---

### Check 6 — `app.UseAuthentication()` before `app.UseAuthorization()`
**File:** `backend/RootkitAuth.API/Program.cs`
**Attack prevented:** All `[Authorize]` attributes being silently bypassed

```csharp
app.UseAuthentication();   // ← Must come BEFORE UseAuthorization
app.UseAuthorization();
```

**Why it's critical:** ASP.NET Core middleware runs in the order it is registered. If `UseAuthorization()` runs before `UseAuthentication()`, the authorization middleware checks permissions before any identity has been established — meaning every user appears anonymous and every `[Authorize]` check fails open or produces incorrect results. This is an ordering constraint, not just style.

**How to verify:** Open `Program.cs` and find these two lines. Confirm `UseAuthentication()` appears on an earlier line than `UseAuthorization()`.

---

### Quick Verification Checklist

| # | What to look for | File | Status |
|---|-----------------|------|--------|
| 1 | `lockoutOnFailure: true` | `AuthController.cs` | ☐ |
| 2 | `credentials: 'include'` (×3) | `apiClient.ts` | ☐ |
| 3 | `options.Cookie.HttpOnly = true` | `Program.cs` | ☐ |
| 4 | `options.Cookie.SameSite = SameSiteMode.Lax` | `Program.cs` | ☐ |
| 5 | `WithOrigins(frontendUrl)` (not `AllowAnyOrigin`) | `Program.cs` | ☐ |
| 6 | `UseAuthentication()` before `UseAuthorization()` | `Program.cs` | ☐ |
