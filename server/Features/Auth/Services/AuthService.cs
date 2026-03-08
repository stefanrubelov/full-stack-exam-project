using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using server.Entities;
using server.Etc;
using server.Features.Auth.Contracts;
using server.Features.Auth.Models.Requests;
using server.Features.Auth.Models.Responses;
using server.Repositories;

namespace server.Features.Auth.Services;

public class AuthService(
    ILogger<AuthService> logger,
    IPasswordHasher<User> passwordHasher,
    IBaseRepository<User> userRepository)
    : IAuthService
{
    public AuthUserResponse Authenticate(LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            throw new AuthenticationError();

        var user = userRepository.Query().FirstOrDefault(u => u.Email == request.Email);

        if (user == null)
            throw new AuthenticationError();

        var result = passwordHasher.VerifyHashedPassword(user, user.Password, request.Password);
        if (result != PasswordVerificationResult.Success)
            throw new AuthenticationError();

        return new AuthUserResponse(user.Id, user.Name, user.Email);
    }

    public async Task<AuthUserResponse> Register(RegisterRequest request)
    {
        var existingUser = userRepository.Query().Any(u => u.Email == request.Email);

        if (existingUser)
        {
            logger.LogWarning("Registration failed: email {Email} already in use", request.Email);
            throw new AuthenticationError("Email already in use");
        }

        var user = new User
        {
            Email = request.Email,
            Name = request.Name,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        user.Password = passwordHasher.HashPassword(user, request.Password);

        await userRepository.AddAsync(user);

        return new AuthUserResponse(user.Id, user.Name, user.Email);
    }

    public AuthUserResponse? GetUserInfo(ClaimsPrincipal principal)
    {
        var idClaim = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (idClaim == null || !Guid.TryParse(idClaim, out var userId))
            return null;

        var user = userRepository.Query().SingleOrDefault(u => u.Id == userId);
        if (user == null) return null;

        return new AuthUserResponse(user.Id, user.Name, user.Email);
    }
}