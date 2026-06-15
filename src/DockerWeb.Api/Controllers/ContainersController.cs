using DockerWeb.Api.Models;
using DockerWeb.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace DockerWeb.Api.Controllers;

/// <summary>Docker container management endpoints.</summary>
[ApiController]
[Route("api/[controller]")]
public sealed class ContainersController : ControllerBase
{
    private const int DefaultLogTail = 200;

    private readonly IContainerService _containerService;

    public ContainersController(IContainerService containerService)
    {
        _containerService = containerService;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ContainerDto>>> List(
        [FromQuery] bool all,
        CancellationToken ct)
    {
        var containers = await _containerService.ListAsync(all, ct);
        return Ok(containers);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Inspect(string id, CancellationToken ct)
    {
        var raw = await _containerService.InspectAsync(id, ct);
        return Ok(raw);
    }

    [HttpPost]
    public async Task<ActionResult<CreateContainerResultDto>> Create(
        [FromBody] CreateContainerRequest request,
        CancellationToken ct)
    {
        var result = await _containerService.CreateAsync(request, ct);
        return CreatedAtAction(nameof(Inspect), new { id = result.Id }, result);
    }

    [HttpPost("{id}/start")]
    public Task<IActionResult> Start(string id, CancellationToken ct) =>
        PerformAsync(id, ContainerAction.Start, ct);

    [HttpPost("{id}/stop")]
    public Task<IActionResult> Stop(string id, CancellationToken ct) =>
        PerformAsync(id, ContainerAction.Stop, ct);

    [HttpPost("{id}/restart")]
    public Task<IActionResult> Restart(string id, CancellationToken ct) =>
        PerformAsync(id, ContainerAction.Restart, ct);

    [HttpPost("{id}/kill")]
    public Task<IActionResult> Kill(string id, CancellationToken ct) =>
        PerformAsync(id, ContainerAction.Kill, ct);

    [HttpPost("{id}/pause")]
    public Task<IActionResult> Pause(string id, CancellationToken ct) =>
        PerformAsync(id, ContainerAction.Pause, ct);

    [HttpPost("{id}/unpause")]
    public Task<IActionResult> Unpause(string id, CancellationToken ct) =>
        PerformAsync(id, ContainerAction.Unpause, ct);

    [HttpDelete("{id}")]
    public async Task<IActionResult> Remove(
        string id,
        [FromQuery] bool force,
        [FromQuery] bool removeVolumes,
        CancellationToken ct)
    {
        await _containerService.RemoveAsync(id, force, removeVolumes, ct);
        return NoContent();
    }

    [HttpGet("{id}/logs")]
    public async Task<ActionResult<LogsDto>> Logs(
        string id,
        [FromQuery] int tail = DefaultLogTail,
        CancellationToken ct = default)
    {
        var logs = await _containerService.GetLogsAsync(id, tail, ct);
        return Ok(logs);
    }

    [HttpPost("prune")]
    public async Task<ActionResult<PruneResultDto>> Prune(CancellationToken ct)
    {
        var result = await _containerService.PruneAsync(ct);
        return Ok(result);
    }

    private async Task<IActionResult> PerformAsync(string id, ContainerAction action, CancellationToken ct)
    {
        await _containerService.PerformAsync(id, action, ct);
        return NoContent();
    }
}
