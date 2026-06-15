using System.Globalization;
using System.Runtime.CompilerServices;
using System.Text;
using System.Threading.Channels;
using Docker.DotNet.Models;
using DockerWeb.Api.Docker;
using DockerWeb.Api.Models;

namespace DockerWeb.Api.Services;

/// <inheritdoc cref="IStatsService" />
public sealed class StatsService : IStatsService
{
    private const int LogBufferSize = 8 * 1024;

    private readonly IDockerConnectionManager _manager;
    private readonly ILogger<StatsService> _logger;

    public StatsService(IDockerConnectionManager manager, ILogger<StatsService> logger)
    {
        _manager = manager;
        _logger = logger;
    }

    public async IAsyncEnumerable<StatsDto> StreamStatsAsync(
        string containerId,
        [EnumeratorCancellation] CancellationToken ct)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(containerId);

        var channel = Channel.CreateBounded<StatsDto>(
            new BoundedChannelOptions(capacity: 16)
            {
                FullMode = BoundedChannelFullMode.DropOldest,
                SingleReader = true,
                SingleWriter = true,
            });

        var progress = new Progress<ContainerStatsResponse>(response =>
        {
            var dto = MapStats(response);
            channel.Writer.TryWrite(dto);
        });

        var pump = Task.Run(async () =>
        {
            try
            {
                await _manager.Client.Containers.GetContainerStatsAsync(
                    containerId,
                    new ContainerStatsParameters { Stream = true },
                    progress,
                    ct);
                channel.Writer.TryComplete();
            }
            catch (OperationCanceledException)
            {
                channel.Writer.TryComplete();
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Stats stream for {Container} ended with error", containerId);
                channel.Writer.TryComplete(ex);
            }
        }, ct);

        try
        {
            await foreach (var stat in channel.Reader.ReadAllAsync(ct))
            {
                yield return stat;
            }
        }
        finally
        {
            await pump.ConfigureAwait(false);
        }
    }

    public async IAsyncEnumerable<string> StreamLogsAsync(
        string containerId,
        int tail,
        [EnumeratorCancellation] CancellationToken ct)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(containerId);

        var parameters = new ContainerLogsParameters
        {
            Follow = true,
            ShowStdout = true,
            ShowStderr = true,
            Timestamps = false,
            Tail = tail.ToString(CultureInfo.InvariantCulture),
        };

        using var stream = await _manager.Client.Containers.GetContainerLogsAsync(
            containerId, tty: false, parameters, ct);

        var buffer = new byte[LogBufferSize];
        var pending = new StringBuilder();

        while (!ct.IsCancellationRequested)
        {
            var read = await stream.ReadOutputAsync(buffer, 0, buffer.Length, ct);
            if (read.EOF)
            {
                break;
            }

            if (read.Count == 0)
            {
                continue;
            }

            pending.Append(Encoding.UTF8.GetString(buffer, 0, read.Count));

            foreach (var line in DrainLines(pending))
            {
                yield return line;
            }
        }

        if (pending.Length > 0)
        {
            yield return pending.ToString();
        }
    }

    private static IEnumerable<string> DrainLines(StringBuilder pending)
    {
        var text = pending.ToString();
        var newlineIndex = text.LastIndexOf('\n');
        if (newlineIndex < 0)
        {
            yield break;
        }

        var complete = text[..newlineIndex];
        pending.Clear();
        pending.Append(text[(newlineIndex + 1)..]);

        foreach (var line in complete.Split('\n'))
        {
            yield return line.TrimEnd('\r');
        }
    }

    private static StatsDto MapStats(ContainerStatsResponse response)
    {
        var cpuPercent = ComputeCpuPercent(response);

        var memoryUsage = (long)(response.MemoryStats?.Usage ?? 0);
        var memoryLimit = (long)(response.MemoryStats?.Limit ?? 0);
        var memoryPercent = memoryLimit > 0
            ? (double)memoryUsage / memoryLimit * 100d
            : 0d;

        long rx = 0, tx = 0;
        if (response.Networks is { Count: > 0 })
        {
            foreach (var net in response.Networks.Values)
            {
                rx += (long)net.RxBytes;
                tx += (long)net.TxBytes;
            }
        }

        var (blockRead, blockWrite) = ComputeBlockIo(response);
        var timestamp = response.Read == default ? DateTime.UtcNow : response.Read;

        return new StatsDto(
            Math.Round(cpuPercent, 2),
            memoryUsage,
            memoryLimit,
            Math.Round(memoryPercent, 2),
            rx,
            tx,
            blockRead,
            blockWrite,
            timestamp);
    }

    private static double ComputeCpuPercent(ContainerStatsResponse response)
    {
        var cpu = response.CPUStats;
        var preCpu = response.PreCPUStats;
        if (cpu?.CPUUsage is null || preCpu?.CPUUsage is null)
        {
            return 0d;
        }

        var cpuDelta = (double)cpu.CPUUsage.TotalUsage - preCpu.CPUUsage.TotalUsage;
        var systemDelta = (double)cpu.SystemUsage - preCpu.SystemUsage;
        if (cpuDelta <= 0 || systemDelta <= 0)
        {
            return 0d;
        }

        var onlineCpus = cpu.OnlineCPUs;
        if (onlineCpus == 0)
        {
            onlineCpus = (uint)(cpu.CPUUsage.PercpuUsage?.Count ?? 1);
        }

        if (onlineCpus == 0)
        {
            onlineCpus = 1;
        }

        return cpuDelta / systemDelta * onlineCpus * 100d;
    }

    private static (long Read, long Write) ComputeBlockIo(ContainerStatsResponse response)
    {
        var entries = response.BlkioStats?.IoServiceBytesRecursive;
        if (entries is null)
        {
            return (0, 0);
        }

        long read = 0, write = 0;
        foreach (var entry in entries)
        {
            switch (entry.Op?.ToLowerInvariant())
            {
                case "read":
                    read += (long)entry.Value;
                    break;
                case "write":
                    write += (long)entry.Value;
                    break;
            }
        }

        return (read, write);
    }
}
