using DockerWeb.Api.Docker;
using DockerWeb.Api.Models;
using DockerWeb.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace DockerWeb.Api.Controllers;

/// <summary>System-level endpoints: engine info, ping, disk usage.</summary>
[ApiController]
[Route("api/[controller]")]
public sealed class SystemController : ControllerBase
{
    private readonly ISystemService _systemService;
    private readonly IDockerConnectionManager _manager;

    public SystemController(ISystemService systemService, IDockerConnectionManager manager)
    {
        _systemService = systemService;
        _manager = manager;
    }

    [HttpGet("info")]
    public async Task<ActionResult<SystemInfoDto>> GetInfo(CancellationToken ct)
    {
        var info = await _systemService.GetInfoAsync(ct);
        return Ok(info);
    }

    [HttpGet("ping")]
    public async Task<ActionResult<PingResultDto>> Ping(CancellationToken ct)
    {
        var ok = await _systemService.PingAsync(ct);
        var connection = _manager.Current.ToDto();
        return Ok(new PingResultDto(ok, connection));
    }

    [HttpGet("df")]
    public async Task<ActionResult<DiskUsageDto>> GetDiskUsage(CancellationToken ct)
    {
        var usage = await _systemService.GetDiskUsageAsync(ct);
        return Ok(usage);
    }
}
