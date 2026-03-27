using Microsoft.AspNetCore.Identity;

namespace RootkitAuth.API.Data;

public class ApplicationUser : IdentityUser
{
    public string? DisplayName { get; set; }
}
