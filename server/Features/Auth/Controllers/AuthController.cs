using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using server.Features.Auth.Contracts;
using server.Features.Auth.Models.Requests;
using server.Features.Auth.Models.Responses;

namespace server.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(
    IAuthService authService,
    ITokenService tokenService,
    ILogger<AuthController> logger)
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
}