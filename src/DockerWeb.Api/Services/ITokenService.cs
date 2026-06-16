using Microsoft.IdentityModel.Tokens;

namespace DockerWeb.Api.Services;

/// <summary>Issues signed JWTs for the single admin user.</summary>
public interface ITokenService
{
    /// <summary>Issue a HS256 JWT for the given username. Returns the token and its UTC expiry.</summary>
    (string Token, DateTime ExpiresAt) CreateToken(string username);

    /// <summary>
    /// The signing key used for issuing tokens. Program.cs reuses this exact
    /// instance for JwtBearer validation so signing and validation always match.
    /// </summary>
    SymmetricSecurityKey SigningKey { get; }
}
