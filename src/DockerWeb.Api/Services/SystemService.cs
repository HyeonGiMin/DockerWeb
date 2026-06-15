using Docker.DotNet.Models;
using DockerWeb.Api.Docker;
using DockerWeb.Api.Models;

namespace DockerWeb.Api.Services;

/// <inheritdoc cref="ISystemService" />
public sealed class SystemService : ISystemService
{
    private readonly IDockerConnectionManager _manager;
    private readonly ILogger<SystemService> _logger;

    public SystemService(IDockerConnectionManager manager, ILogger<SystemService> logger)
    {
        _manager = manager;
        _logger = logger;
    }

    public async Task<SystemInfoDto> GetInfoAsync(CancellationToken ct)
    {
        var info = await _manager.Client.System.GetSystemInfoAsync(ct);
        var version = await _manager.Client.System.GetVersionAsync(ct);

        return new SystemInfoDto(
            info.ID,
            info.Name,
            version.Version,
            info.OperatingSystem,
            info.Architecture,
            (int)info.Containers,
            (int)info.ContainersRunning,
            (int)info.ContainersPaused,
            (int)info.ContainersStopped,
            (int)info.Images,
            (int)info.NCPU,
            info.MemTotal,
            info.KernelVersion,
            info.DockerRootDir);
    }

    public async Task<bool> PingAsync(CancellationToken ct)
    {
        await _manager.Client.System.PingAsync(ct);
        return true;
    }

    public async Task<DiskUsageDto> GetDiskUsageAsync(CancellationToken ct)
    {
        var images = await _manager.Client.Images.ListImagesAsync(
            new ImagesListParameters { All = true }, ct);
        var containers = await _manager.Client.Containers.ListContainersAsync(
            new ContainersListParameters { All = true }, ct);
        var volumes = await _manager.Client.Volumes.ListAsync(ct);

        var imagesSize = images.Sum(i => i.Size);
        var layersSize = images.Sum(i => i.SharedSize > 0 ? i.SharedSize : 0);
        var volumeCount = volumes.Volumes?.Count ?? 0;

        return new DiskUsageDto(
            images.Count,
            imagesSize,
            containers.Count,
            volumeCount,
            layersSize);
    }
}
