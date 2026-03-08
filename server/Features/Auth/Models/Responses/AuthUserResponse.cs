namespace server.Features.Auth.Models.Responses;

public record AuthUserResponse(Guid Id, string Name, string Email);
