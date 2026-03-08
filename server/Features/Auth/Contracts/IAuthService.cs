using System.Security.Claims;
using server.Features.Auth.Models.Requests;
using server.Features.Auth.Models.Responses;

namespace server.Features.Auth.Contracts;

public interface IAuthService
{
    AuthUserResponse Authenticate(LoginRequest request);
    Task<AuthUserResponse> Register(RegisterRequest request);
    AuthUserResponse? GetUserInfo(ClaimsPrincipal principal);
}