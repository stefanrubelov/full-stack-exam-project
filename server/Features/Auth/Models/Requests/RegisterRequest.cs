using System.ComponentModel.DataAnnotations;

namespace server.Features.Auth.Models.Requests;

public class RegisterRequest
{
    [Required] public string Name { get; set; } = null!;

    [EmailAddress] [Required] public string Email { get; set; } = null!;

    [MinLength(8)] public string Password { get; set; } = null!;

    [Required] [Compare(nameof(Password), ErrorMessage = "Passwords do not match")]
    public string ConfirmPassword { get; set; } = null!;
}
