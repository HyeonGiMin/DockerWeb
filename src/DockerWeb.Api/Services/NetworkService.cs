using Docker.DotNet.Models;
using DockerWeb.Api.Docker;
using DockerWeb.Api.Models;

namespace DockerWeb.Api.Services;

/// <inheritdoc cref="INetworkService" />
public sealed class NetworkService : INetworkService
{
    private readonly IDockerConnectionManager _manager;
    private readonly ILogger<NetworkService> _logger;

    public NetworkService(IDockerConnectionManager manager, ILogger<NetworkService> logger)
    {
        _manager = manager;
        _logger = logger;
    }

    public async Task<IReadOnlyList<NetworkDto>> ListAsync(CancellationToken ct)
    {
        var networks = await _manager.Client.Networks.ListNetworksAsync(
            new NetworksListParameters(), ct);

        return networks.Select(Map).ToList();
    }

    public Task<NetworkResponse> InspectAsync(string id, CancellationToken ct)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(id);
        return _manager.Client.Networks.InspectNetworkAsync(id, ct);
    }

    public async Task<NetworkDto> CreateAsync(CreateNetworkRequest request, CancellationToken ct)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(request.Name);

        var created = await _manager.Client.Networks.CreateNetworkAsync(
            new NetworksCreateParameters
            {
                Name = request.Name,
                Driver = request.Driver,
                Internal = request.Internal,
            },
            ct);

        _logger.LogInformation("Created network {Network} ({Id})", request.Name, created.ID);
        var inspected = await _manager.Client.Networks.InspectNetworkAsync(created.ID, ct);
        return Map(inspected);
    }

    public Task DeleteAsync(string id, CancellationToken ct)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(id);
        _logger.LogInformation("Deleting network {Network}", id);
        return _manager.Client.Networks.DeleteNetworkAsync(id, ct);
    }

    private static NetworkDto Map(NetworkResponse network)
    {
        var labels = network.Labels ?? new Dictionary<string, string>();
        var containerCount = network.Containers?.Count ?? 0;

        return new NetworkDto(
            network.ID,
            network.Name,
            network.Driver,
            network.Scope,
            network.Internal,
            network.Created,
            containerCount,
            new Dictionary<string, string>(labels));
    }
}
