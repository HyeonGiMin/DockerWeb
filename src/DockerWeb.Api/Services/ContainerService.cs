using System.Globalization;
using Docker.DotNet.Models;
using DockerWeb.Api.Docker;
using DockerWeb.Api.Models;

namespace DockerWeb.Api.Services;

/// <inheritdoc cref="IContainerService" />
public sealed class ContainerService : IContainerService
{
    private readonly IDockerConnectionManager _manager;
    private readonly ILogger<ContainerService> _logger;

    public ContainerService(IDockerConnectionManager manager, ILogger<ContainerService> logger)
    {
        _manager = manager;
        _logger = logger;
    }

    public async Task<IReadOnlyList<ContainerDto>> ListAsync(bool all, CancellationToken ct)
    {
        var containers = await _manager.Client.Containers.ListContainersAsync(
            new ContainersListParameters { All = all }, ct);

        return containers.Select(Map).ToList();
    }

    public Task<ContainerInspectResponse> InspectAsync(string id, CancellationToken ct)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(id);
        return _manager.Client.Containers.InspectContainerAsync(id, ct);
    }

    public async Task<CreateContainerResultDto> CreateAsync(CreateContainerRequest request, CancellationToken ct)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(request.Image);

        var parameters = BuildCreateParameters(request);
        var response = await _manager.Client.Containers.CreateContainerAsync(parameters, ct);

        if (request.AutoStart)
        {
            await _manager.Client.Containers.StartContainerAsync(
                response.ID, new ContainerStartParameters(), ct);
        }

        var warnings = response.Warnings ?? new List<string>();
        return new CreateContainerResultDto(response.ID, warnings.ToList());
    }

    public Task PerformAsync(string id, ContainerAction action, CancellationToken ct)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(id);
        var containers = _manager.Client.Containers;

        return action switch
        {
            ContainerAction.Start => containers.StartContainerAsync(id, new ContainerStartParameters(), ct),
            ContainerAction.Stop => containers.StopContainerAsync(id, new ContainerStopParameters(), ct),
            ContainerAction.Restart => containers.RestartContainerAsync(id, new ContainerRestartParameters(), ct),
            ContainerAction.Kill => containers.KillContainerAsync(id, new ContainerKillParameters(), ct),
            ContainerAction.Pause => containers.PauseContainerAsync(id, ct),
            ContainerAction.Unpause => containers.UnpauseContainerAsync(id, ct),
            _ => throw new ArgumentOutOfRangeException(nameof(action), action, "Unknown container action."),
        };
    }

    public Task RemoveAsync(string id, bool force, bool removeVolumes, CancellationToken ct)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(id);
        _logger.LogInformation("Removing container {Container} (force={Force})", id, force);

        return _manager.Client.Containers.RemoveContainerAsync(
            id,
            new ContainerRemoveParameters { Force = force, RemoveVolumes = removeVolumes },
            ct);
    }

    public async Task<LogsDto> GetLogsAsync(string id, int tail, CancellationToken ct)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(id);

        var parameters = new ContainerLogsParameters
        {
            ShowStdout = true,
            ShowStderr = true,
            Timestamps = false,
            Tail = tail.ToString(CultureInfo.InvariantCulture),
        };

        using var stream = await _manager.Client.Containers.GetContainerLogsAsync(
            id, tty: false, parameters, ct);

        var (stdout, stderr) = await stream.ReadOutputToEndAsync(ct);
        var combined = string.Concat(stdout, stderr);
        return new LogsDto(combined);
    }

    public async Task<PruneResultDto> PruneAsync(CancellationToken ct)
    {
        var response = await _manager.Client.Containers.PruneContainersAsync(
            new ContainersPruneParameters(), ct);

        var deleted = response.ContainersDeleted?.Count ?? 0;
        return new PruneResultDto(deleted, (long)response.SpaceReclaimed);
    }

    private static CreateContainerParameters BuildCreateParameters(CreateContainerRequest request)
    {
        var exposedPorts = new Dictionary<string, EmptyStruct>();
        var portBindings = new Dictionary<string, IList<PortBinding>>();

        foreach (var port in request.Ports ?? Array.Empty<PortMappingDto>())
        {
            var protocol = string.IsNullOrWhiteSpace(port.Protocol) ? "tcp" : port.Protocol;
            var key = $"{port.ContainerPort.ToString(CultureInfo.InvariantCulture)}/{protocol}";
            exposedPorts[key] = default;

            if (port.HostPort is { } hostPort)
            {
                portBindings[key] = new List<PortBinding>
                {
                    new() { HostPort = hostPort.ToString(CultureInfo.InvariantCulture) },
                };
            }
        }

        var binds = (request.Volumes ?? Array.Empty<VolumeMountDto>())
            .Select(v => v.ReadOnly ? $"{v.Source}:{v.Target}:ro" : $"{v.Source}:{v.Target}")
            .ToList();

        var hostConfig = new HostConfig
        {
            PortBindings = portBindings,
            Binds = binds,
            RestartPolicy = BuildRestartPolicy(request.RestartPolicy),
        };

        return new CreateContainerParameters
        {
            Image = request.Image,
            Name = request.Name,
            Cmd = request.Cmd?.ToList(),
            Env = request.Env?.ToList(),
            ExposedPorts = exposedPorts,
            HostConfig = hostConfig,
        };
    }

    private static RestartPolicy BuildRestartPolicy(string? policy)
    {
        var kind = policy?.ToLowerInvariant() switch
        {
            "always" => RestartPolicyKind.Always,
            "unless-stopped" => RestartPolicyKind.UnlessStopped,
            "on-failure" => RestartPolicyKind.OnFailure,
            "no" or null or "" => RestartPolicyKind.No,
            _ => RestartPolicyKind.No,
        };

        return new RestartPolicy { Name = kind };
    }

    private static ContainerDto Map(ContainerListResponse container)
    {
        var ports = (container.Ports ?? new List<Port>())
            .Select(p => new PortDto(
                (int)p.PrivatePort,
                p.PublicPort == 0 ? null : (int)p.PublicPort,
                p.Type ?? "tcp",
                string.IsNullOrEmpty(p.IP) ? null : p.IP))
            .ToList();

        var labels = container.Labels ?? new Dictionary<string, string>();
        var names = container.Names ?? new List<string>();

        return new ContainerDto(
            container.ID,
            names.ToList(),
            container.Image ?? string.Empty,
            container.ImageID ?? string.Empty,
            container.Command ?? string.Empty,
            container.Created,
            container.State ?? string.Empty,
            container.Status ?? string.Empty,
            ports,
            new Dictionary<string, string>(labels));
    }
}
