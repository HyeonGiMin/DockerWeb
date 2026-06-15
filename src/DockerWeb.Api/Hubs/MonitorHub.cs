using DockerWeb.Api.Models;
using DockerWeb.Api.Services;
using Microsoft.AspNetCore.SignalR;

namespace DockerWeb.Api.Hubs;

/// <summary>
/// SignalR hub streaming live container stats and logs to connected clients.
/// Mounted at <c>/hubs/monitor</c>.
/// </summary>
public sealed class MonitorHub : Hub
{
    private const int DefaultLogTail = 200;

    private readonly IStatsService _statsService;

    public MonitorHub(IStatsService statsService)
    {
        _statsService = statsService;
    }

    /// <summary>Streams resource statistics for a container until the client disconnects.</summary>
    public IAsyncEnumerable<StatsDto> StreamStats(string containerId, CancellationToken ct) =>
        _statsService.StreamStatsAsync(containerId, ct);

    /// <summary>Streams log lines for a container, following new output.</summary>
    public IAsyncEnumerable<string> StreamLogs(string containerId, int tail, CancellationToken ct)
    {
        var effectiveTail = tail <= 0 ? DefaultLogTail : tail;
        return _statsService.StreamLogsAsync(containerId, effectiveTail, ct);
    }
}
