namespace DockerWeb.Api.Models;

/// <summary>Summary of the connected Docker engine.</summary>
public sealed record SystemInfoDto(
    string? Id,
    string? Name,
    string? ServerVersion,
    string? OperatingSystem,
    string? Architecture,
    int Containers,
    int ContainersRunning,
    int ContainersPaused,
    int ContainersStopped,
    int Images,
    int NcpU,
    long MemTotal,
    string? KernelVersion,
    string? DockerRootDir);

/// <summary>Describes the active Docker connection.</summary>
public sealed record ConnectionInfoDto(string Mode, string Endpoint, bool TlsEnabled);

/// <summary>Result of a ping against the engine plus the active connection.</summary>
public sealed record PingResultDto(bool Ok, ConnectionInfoDto Connection);

/// <summary>Aggregated disk usage across images, containers and volumes.</summary>
public sealed record DiskUsageDto(
    int ImageCount,
    long ImagesSize,
    int ContainerCount,
    int VolumeCount,
    long LayersSize);
