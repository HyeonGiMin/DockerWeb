using DockerWeb.Api.Models;

namespace DockerWeb.Api.Services;

/// <summary>System-level operations: info, ping, disk usage.</summary>
public interface ISystemService
{
    Task<SystemInfoDto> GetInfoAsync(CancellationToken ct);

    Task<bool> PingAsync(CancellationToken ct);

    Task<DiskUsageDto> GetDiskUsageAsync(CancellationToken ct);
}
