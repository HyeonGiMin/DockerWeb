namespace DockerWeb.Api.Models;

/// <summary>A Docker volume as listed by the engine.</summary>
public sealed record VolumeDto(
    string Name,
    string Driver,
    string Mountpoint,
    string? CreatedAt,
    string Scope,
    IReadOnlyDictionary<string, string> Labels);

/// <summary>Request to create a new volume.</summary>
public sealed record CreateVolumeRequest(
    string? Name,
    string? Driver,
    IReadOnlyDictionary<string, string>? Labels);
