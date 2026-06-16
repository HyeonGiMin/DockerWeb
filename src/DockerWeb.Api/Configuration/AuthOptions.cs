namespace DockerWeb.Api.Configuration;

/// <summary>
/// Bound from the "Auth" configuration section. Holds the single admin
/// credential and JWT settings for the minimal login feature.
/// </summary>
public sealed class AuthOptions
{
    public const string SectionName = "Auth";

    /// <summary>The single admin username.</summary>
    public string Username { get; set; } = "admin";

    /// <summary>The single admin password.</summary>
    public string Password { get; set; } = "admin";

    /// <summary>
    /// HS256 signing secret. If null/empty/shorter than 32 chars, a random
    /// key is generated once at startup (tokens then won't survive restarts).
    /// </summary>
    public string? JwtSecret { get; set; }

    /// <summary>Token lifetime in hours.</summary>
    public int TokenHours { get; set; } = 12;
}
