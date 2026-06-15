using DockerWeb.Api.Models;
using DockerWeb.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace DockerWeb.Api.Controllers;

/// <summary>Docker network management endpoints.</summary>
[ApiController]
[Route("api/[controller]")]
public sealed class NetworksController : ControllerBase
{
    private readonly INetworkService _networkService;

    public NetworksController(INetworkService networkService)
    {
        _networkService = networkService;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<NetworkDto>>> List(CancellationToken ct)
    {
        var networks = await _networkService.ListAsync(ct);
        return Ok(networks);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Inspect(string id, CancellationToken ct)
    {
        var raw = await _networkService.InspectAsync(id, ct);
        return Ok(raw);
    }

    [HttpPost]
    public async Task<ActionResult<NetworkDto>> Create(
        [FromBody] CreateNetworkRequest request,
        CancellationToken ct)
    {
        var network = await _networkService.CreateAsync(request, ct);
        return CreatedAtAction(nameof(Inspect), new { id = network.Id }, network);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id, CancellationToken ct)
    {
        await _networkService.DeleteAsync(id, ct);
        return NoContent();
    }
}
