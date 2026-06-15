using Docker.DotNet.Models;
using DockerWeb.Api.Models;

namespace DockerWeb.Api.Services;

/// <summary>Lifecycle actions that act on a single container.</summary>
public enum ContainerAction
{
    Start,
    Stop,
    Restart,
    Kill,
    Pause,
    Unpause,
}

/// <summary>Operations against Docker containers.</summary>
public interface IContainerService
{
    Task<IReadOnlyList<ContainerDto>> ListAsync(bool all, CancellationToken ct);

    Task<ContainerInspectResponse> InspectAsync(string id, CancellationToken ct);

    Task<CreateContainerResultDto> CreateAsync(CreateContainerRequest request, CancellationToken ct);

    Task PerformAsync(string id, ContainerAction action, CancellationToken ct);

    Task RemoveAsync(string id, bool force, bool removeVolumes, CancellationToken ct);

    Task<LogsDto> GetLogsAsync(string id, int tail, CancellationToken ct);

    Task<PruneResultDto> PruneAsync(CancellationToken ct);
}
