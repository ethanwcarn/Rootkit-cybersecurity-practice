using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using RootkitAuth.API.Data;
using RootkitAuth.API.Models.Auth;
using RootkitAuth.API.Policies;

namespace RootkitAuth.API.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize(Policy = AuthorizationPolicies.RequireAdmin)]
public class AdminController(UserManager<ApplicationUser> userManager) : ControllerBase
{
    [HttpGet("users")]
    public async Task<ActionResult<IEnumerable<AuthUserResponse>>> GetUsers()
    {
        var users = userManager.Users.ToList();
        var response = new List<AuthUserResponse>(users.Count);

        foreach (var user in users)
        {
            var roles = await userManager.GetRolesAsync(user);
            response.Add(new AuthUserResponse
            {
                UserId = user.Id,
                Email = user.Email ?? string.Empty,
                DisplayName = user.DisplayName,
                Roles = roles.ToArray(),
                TwoFactorEnabled = user.TwoFactorEnabled
            });
        }

        return Ok(response);
    }
}
