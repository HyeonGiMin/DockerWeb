namespace DockerWeb.Api.Models;

/// <summary>Request body to switch the active Docker connection at runtime.</summary>
public sealed record UpdateConnectionRequest(
    string Mode,
    string? LocalEndpoint,
    string? RemoteEndpoint,
    TlsSettingsDto? Tls);

/// <summary>Client TLS settings supplied when switching to a remote connection.</summary>
public sealed record TlsSettingsDto(
    bool Enabled,
    string? ClientCertPath,
    string? ClientCertPassword);
