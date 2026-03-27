using System.ComponentModel.DataAnnotations;

namespace RootkitAuth.API.Models.Auth;

public class MfaVerifyRequest
{
    [Required]
    [MinLength(6)]
    [MaxLength(8)]
    public string Code { get; set; } = string.Empty;
}
