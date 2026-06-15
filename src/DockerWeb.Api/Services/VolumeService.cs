using Docker.DotNet.Models;
using DockerWeb.Api.Docker;
using DockerWeb.Api.Models;

namespace DockerWeb.Api.Services;

/// <inheritdoc cref="IVolumeService" />
public sealed class VolumeService : IVolumeService
{
    private readonly IDockerConnectionManager _manager;
    private readonly ILogger<VolumeService> _logger;

    public VolumeService(IDockerConnectionManager manager, ILogger<VolumeService> logger)
    {
        _manager = manager;
        _logger = logger;
    }

    public async Task<IReadOnlyList<VolumeDto>> ListAsync(CancellationToken ct)
    {
        var response = await _manager.Client.Volumes.ListAsync(ct);
        var volumes = response.Volumes ?? new List<VolumeResponse>();
        return volumes.Select(Map).ToList();
    }

    public async Task<VolumeDto> CreateAsync(CreateVolumeRequest request, CancellationToken ct)
    {
        var labels = request.Labels is null
            ? null
            : new Dictionary<string, string>(request.Labels);

        var created = await _manager.Client.Volumes.CreateAsync(
            new VolumesCreateParameters
            {
                Name = request.Name,
                Driver = request.Driver,
                Labels = labels,
            },
            ct);

        _logger.LogInformation("Created volume {Volume}", created.Name);
        return Map(created);
    }

    public Task RemoveAsync(string name, bool force, CancellationToken ct)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name);
        _logger.LogInformation("Removing volume {Volume} (force={Force})", name, force);
        return _manager.Client.Volumes.RemoveAsync(name, force, ct);
    }

    public async Task<PruneResultDto> PruneAsync(CancellationToken ct)
    {
        var response = await _manager.Client.Volumes.PruneAsync(new VolumesPruneParameters(), ct);
        var deleted = response.VolumesDeleted?.Count ?? 0;
        return new PruneResultDto(deleted, (long)response.SpaceReclaimed);
    }

    private static VolumeDto Map(VolumeResponse volume)
    {
        var labels = volume.Labels ?? new Dictionary<string, string>();
        return new VolumeDto(
            volume.Name,
            volume.Driver,
            volume.Mountpoint,
            string.IsNullOrEmpty(volume.CreatedAt) ? null : volume.CreatedAt,
            volume.Scope ?? string.Empty,
            new Dictionary<string, string>(labels));
    }
}
