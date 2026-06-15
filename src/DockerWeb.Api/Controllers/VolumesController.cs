using DockerWeb.Api.Models;
using DockerWeb.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace DockerWeb.Api.Controllers;

/// <summary>Docker volume management endpoints.</summary>
[ApiController]
[Route("api/[controller]")]
public sealed class VolumesController : ControllerBase
{
    private readonly IVolumeService _volumeService;

    public VolumesController(IVolumeService volumeService)
    {
        _volumeService = volumeService;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<VolumeDto>>> List(CancellationToken ct)
    {
        var volumes = await _volumeService.ListAsync(ct);
        return Ok(volumes);
    }

    [HttpPost]
    public async Task<ActionResult<VolumeDto>> Create(
        [FromBody] CreateVolumeRequest request,
        CancellationToken ct)
    {
        var volume = await _volumeService.CreateAsync(request, ct);
        return CreatedAtAction(nameof(List), new { name = volume.Name }, volume);
    }

    [HttpDelete("{name}")]
    public async Task<IActionResult> Remove(string name, [FromQuery] bool force, CancellationToken ct)
    {
        await _volumeService.RemoveAsync(name, force, ct);
        return NoContent();
    }

    [HttpPost("prune")]
    public async Task<ActionResult<PruneResultDto>> Prune(CancellationToken ct)
    {
        var result = await _volumeService.PruneAsync(ct);
        return Ok(result);
    }
}
