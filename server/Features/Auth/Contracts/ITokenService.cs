using server.Features.Auth.Models.Responses;

namespace server.Features.Auth.Contracts;

public interface ITokenService
{
    string CreateToken(AuthUserResponse user);
}
