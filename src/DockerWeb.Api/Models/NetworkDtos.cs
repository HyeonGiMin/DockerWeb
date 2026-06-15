namespace DockerWeb.Api.Models;

/// <summary>A Docker network as listed by the engine.</summary>
public sealed record NetworkDto(
    string Id,
    string Name,
    string Driver,
    string Scope,
    bool Internal,
    DateTime Created,
    int ContainerCount,
    IReadOnlyDictionary<string, string> Labels);

/// <summary>Request to create a new network.</summary>
public sealed record CreateNetworkRequest(string Name, string? Driver, bool Internal);

/// <summary>A single sampled point of container resource statistics.</summary>
public sealed record StatsDto(
    double CpuPercent,
    long MemoryUsage,
    long MemoryLimit,
    double MemoryPercent,
    long NetworkRx,
    long NetworkTx,
    long BlockRead,
    long BlockWrite,
    DateTime Timestamp);
