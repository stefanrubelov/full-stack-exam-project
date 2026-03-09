namespace server.Features.Auth.Models.Requests;

public record UpdateProfileRequest(string? Name, string? CurrentPassword, string? NewPassword);
