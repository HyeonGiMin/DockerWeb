namespace DockerWeb.Api.Models;

/// <summary>Credentials submitted to the login endpoint.</summary>
public sealed record LoginRequest(string Username, string Password);

/// <summary>Issued token plus its metadata.</summary>
public sealed record LoginResponse(string Token, DateTime ExpiresAt, string Username);
