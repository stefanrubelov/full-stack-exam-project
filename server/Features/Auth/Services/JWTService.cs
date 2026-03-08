using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;
using server.Features.Auth.Contracts;
using server.Features.Auth.Models.Responses;

namespace server.Features.Auth.Services;

public class JwtService(IConfiguration config) : ITokenService
{
    public const string SignatureAlgorithm = SecurityAlgorithms.HmacSha256;

    public string CreateToken(AuthUserResponse user)
    {
        var key = Encoding.UTF8.GetBytes(config["ConnectionStrings:Secret"]
                                         ?? throw new Exception("JWT secret not configured"));
        var tokenDescriptor = new SecurityTokenDescriptor
        {
            SigningCredentials = new SigningCredentials(
                new SymmetricSecurityKey(key),
                SignatureAlgorithm
            ),
            Subject = new ClaimsIdentity([
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Name),
                new Claim(ClaimTypes.Email, user.Email),
            ]),
            Expires = DateTime.UtcNow.AddDays(7),
        };
        var tokenHandler = new JsonWebTokenHandler();
        return tokenHandler.CreateToken(tokenDescriptor);
    }

    public static TokenValidationParameters CreateValidationParams(IConfiguration configuration)
    {
        var secret = configuration["ConnectionStrings:Secret"]
                     ?? throw new Exception("JWT secret not configured");

        var key = Encoding.UTF8.GetBytes(secret);
        return new TokenValidationParameters
        {
            IssuerSigningKey = new SymmetricSecurityKey(key),
            ValidAlgorithms = [SignatureAlgorithm],
            ValidateIssuerSigningKey = true,
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero,
        };
    }
}