using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using DockerWeb.Api.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace DockerWeb.Api.Services;

/// <summary>
/// HS256 JWT issuer for the single admin user. The signing key is derived from
/// <see cref="AuthOptions.JwtSecret"/> when it is long enough; otherwise a random
/// key is generated once per process (logged as a warning).
/// </summary>
public sealed class TokenService : ITokenService
{
    /// <summary>Issuer + audience are a fixed constant for this single-tenant app.</summary>
    public const string Issuer = "DockerWeb";
    public const string Audience = "DockerWeb";

    private const int MinSecretLength = 32;

    private readonly AuthOptions _options;

    public SymmetricSecurityKey SigningKey { get; }

    public TokenService(AuthOptions options, ILogger<TokenService> logger)
    {
        _options = options;

        var secret = options.JwtSecret;
        if (string.IsNullOrWhiteSpace(secret) || secret.Length < MinSecretLength)
        {
            // Generate a stable-per-process random key. Tokens won't survive a restart.
            secret = GenerateRandomKey();
            logger.LogWarning(
                "Auth:JwtSecret is missing or shorter than {Min} chars. A random signing key " +
                "was generated for this process; issued tokens will NOT survive a restart. " +
                "Set a stable 'Auth__JwtSecret' (>= {Min} chars) for production.",
                MinSecretLength,
                MinSecretLength);
        }

        SigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
    }

    public (string Token, DateTime ExpiresAt) CreateToken(string username)
    {
        var now = DateTime.UtcNow;
        var expiresAt = now.AddHours(_options.TokenHours);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, username),
            new Claim(ClaimTypes.Name, username),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
        };

        var credentials = new SigningCredentials(SigningKey, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: Issuer,
            audience: Audience,
            claims: claims,
            notBefore: now,
            expires: expiresAt,
            signingCredentials: credentials);

        var encoded = new JwtSecurityTokenHandler().WriteToken(token);
        return (encoded, expiresAt);
    }

    /// <summary>Generate a 64-char random base64 key (well above the 32-char minimum).</summary>
    private static string GenerateRandomKey()
    {
        var bytes = RandomNumberGenerator.GetBytes(48);
        return Convert.ToBase64String(bytes); // 64 chars
    }
}
