using System.ComponentModel.DataAnnotations;

namespace server.Features.Auth.Models.Requests;

public class LoginRequest
{
    [EmailAddress]
    [Required]
    [MaxLength(256)]
    public string Email { get; set; } = null!;

    [Required]
    [MinLength(8)]
    [MaxLength(128)]
    public string Password { get; set; } = null!;
}
