using System.Security.Cryptography;
using System.Text;
using DockerWeb.Api.Configuration;
using DockerWeb.Api.Models;
using DockerWeb.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DockerWeb.Api.Controllers;

/// <summary>Single-admin login. Issues a JWT on valid credentials.</summary>
[ApiController]
[Route("api/[controller]")]
[AllowAnonymous]
public sealed class AuthController : ControllerBase
{
    private readonly AuthOptions _options;
    private readonly ITokenService _tokenService;

    public AuthController(AuthOptions options, ITokenService tokenService)
    {
        _options = options;
        _tokenService = tokenService;
    }

    /// <summary>Validate credentials and return a bearer token.</summary>
    [HttpPost("login")]
    public ActionResult<LoginResponse> Login([FromBody] LoginRequest request)
    {
        var usernameOk = FixedTimeEquals(request.Username, _options.Username);
        var passwordOk = FixedTimeEquals(request.Password, _options.Password);

        // Evaluate both before branching so timing does not leak which field failed.
        if (!usernameOk || !passwordOk)
        {
            return Problem(
                detail: "Invalid credentials",
                statusCode: StatusCodes.Status401Unauthorized,
                title: "Unauthorized");
        }

        var (token, expiresAt) = _tokenService.CreateToken(_options.Username);
        return Ok(new LoginResponse(token, expiresAt, _options.Username));
    }

    /// <summary>
    /// Return the authenticated user's name. The controller is [AllowAnonymous] so
    /// the SPA/login routes stay public; this action enforces auth manually and
    /// returns 401 when no valid token was presented.
    /// </summary>
    [HttpGet("me")]
    public ActionResult<object> Me()
    {
        if (User.Identity?.IsAuthenticated != true)
        {
            return Problem(
                detail: "Authentication required",
                statusCode: StatusCodes.Status401Unauthorized,
                title: "Unauthorized");
        }

        var username = User.Identity?.Name ?? string.Empty;
        return Ok(new { username });
    }

    /// <summary>Constant-time UTF8 comparison of two strings.</summary>
    private static bool FixedTimeEquals(string a, string b) =>
        CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(a ?? string.Empty),
            Encoding.UTF8.GetBytes(b ?? string.Empty));
}
