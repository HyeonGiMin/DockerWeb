using Docker.DotNet.Models;
using DockerWeb.Api.Models;

namespace DockerWeb.Api.Services;

/// <summary>Operations against Docker networks.</summary>
public interface INetworkService
{
    Task<IReadOnlyList<NetworkDto>> ListAsync(CancellationToken ct);

    Task<NetworkResponse> InspectAsync(string id, CancellationToken ct);

    Task<NetworkDto> CreateAsync(CreateNetworkRequest request, CancellationToken ct);

    Task DeleteAsync(string id, CancellationToken ct);
}
