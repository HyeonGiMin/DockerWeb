using DockerWeb.Api.Models;

namespace DockerWeb.Api.Services;

/// <summary>Operations against Docker volumes.</summary>
public interface IVolumeService
{
    Task<IReadOnlyList<VolumeDto>> ListAsync(CancellationToken ct);

    Task<VolumeDto> CreateAsync(CreateVolumeRequest request, CancellationToken ct);

    Task RemoveAsync(string name, bool force, CancellationToken ct);

    Task<PruneResultDto> PruneAsync(CancellationToken ct);
}
