using DockerWeb.Api.Models;

namespace DockerWeb.Api.Services;

/// <summary>Streaming sources for live container monitoring.</summary>
public interface IStatsService
{
    /// <summary>Streams resource statistics for a container until cancelled.</summary>
    IAsyncEnumerable<StatsDto> StreamStatsAsync(string containerId, CancellationToken ct);

    /// <summary>Streams log lines for a container, following new output, until cancelled.</summary>
    IAsyncEnumerable<string> StreamLogsAsync(string containerId, int tail, CancellationToken ct);
}
