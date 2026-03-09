using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using server.Entities;
using server.Features.Auth.Contracts;
using server.Features.Auth.Models.Requests;
using server.Features.Auth.Models.Responses;

namespace server.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(
    IAuthService authService,
    ITokenService tokenService,
    ILogger<AuthController> logger,
    MyDbContext db,
    IPasswordHasher<User> passwordHasher)
    : ControllerBase
{
    [HttpPost(nameof(Login))]
    [AllowAnonymous]
    public LoginResponse Login([FromBody] LoginRequest request)
    {
        var userInfo = authService.Authenticate(request);
        var token = tokenService.CreateToken(userInfo);
        return new LoginResponse(token);
    }

    [HttpPost(nameof(Register))]
    [AllowAnonymous]
    public async Task<RegisterResponse> Register([FromBody] RegisterRequest request)
    {
        var userInfo = await authService.Register(request);
        return new RegisterResponse(userInfo.Name);
    }

    [HttpPost(nameof(Logout))]
    public IActionResult Logout()
    {
        return Ok();
    }

    [HttpGet(nameof(UserInfo))]
    public ActionResult<AuthUserResponse> UserInfo()
    {
        var user = authService.GetUserInfo(User);
        if (user == null) return Unauthorized();
        return Ok(user);
    }

    [HttpPut("profile")]
    [Authorize]
    public ActionResult<AuthUserResponse> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (idClaim == null || !Guid.TryParse(idClaim, out var userId))
            return Unauthorized();

        var user = db.Users.Find(userId);
        if (user == null) return Unauthorized();

        if (!string.IsNullOrWhiteSpace(request.Name))
            user.Name = request.Name;

        if (!string.IsNullOrWhiteSpace(request.CurrentPassword) && !string.IsNullOrWhiteSpace(request.NewPassword))
        {
            var result = passwordHasher.VerifyHashedPassword(user, user.Password, request.CurrentPassword);
            if (result != PasswordVerificationResult.Success)
                return BadRequest(new { error = "Current password is incorrect" });

            user.Password = passwordHasher.HashPassword(user, request.NewPassword);
        }

        user.UpdatedAt = DateTime.UtcNow;
        db.Users.Update(user);
        db.SaveChanges();

        return Ok(new AuthUserResponse(user.Id, user.Name, user.Email));
    }
}