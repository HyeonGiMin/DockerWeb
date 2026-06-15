namespace DockerWeb.Api.Models;

/// <summary>A Docker container as listed by the engine.</summary>
public sealed record ContainerDto(
    string Id,
    IReadOnlyList<string> Names,
    string Image,
    string ImageId,
    string Command,
    DateTime Created,
    string State,
    string Status,
    IReadOnlyList<PortDto> Ports,
    IReadOnlyDictionary<string, string> Labels);

/// <summary>A published or exposed container port.</summary>
public sealed record PortDto(int PrivatePort, int? PublicPort, string Type, string? Ip);

/// <summary>Request to create a new container.</summary>
public sealed record CreateContainerRequest(
    string Image,
    string? Name,
    IReadOnlyList<string>? Cmd,
    IReadOnlyList<string>? Env,
    IReadOnlyList<PortMappingDto>? Ports,
    IReadOnlyList<VolumeMountDto>? Volumes,
    string? RestartPolicy,
    bool AutoStart);

/// <summary>Maps a container port to an optional host port.</summary>
public sealed record PortMappingDto(int ContainerPort, int? HostPort, string? Protocol);

/// <summary>Binds a host source path or volume to a container target path.</summary>
public sealed record VolumeMountDto(string Source, string Target, bool ReadOnly);

/// <summary>Result of creating a container.</summary>
public sealed record CreateContainerResultDto(string Id, IReadOnlyList<string> Warnings);

/// <summary>A snapshot of container logs.</summary>
public sealed record LogsDto(string Logs);
