using DockerWeb.Api.Models;
using DockerWeb.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace DockerWeb.Api.Controllers;

/// <summary>Docker image management endpoints.</summary>
[ApiController]
[Route("api/[controller]")]
public sealed class ImagesController : ControllerBase
{
    private readonly IImageService _imageService;

    public ImagesController(IImageService imageService)
    {
        _imageService = imageService;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ImageDto>>> List(CancellationToken ct)
    {
        var images = await _imageService.ListAsync(ct);
        return Ok(images);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Inspect(string id, CancellationToken ct)
    {
        var raw = await _imageService.InspectAsync(id, ct);
        return Ok(raw);
    }

    [HttpPost("pull")]
    public async Task<IActionResult> Pull([FromBody] PullImageRequest request, CancellationToken ct)
    {
        await _imageService.PullAsync(request, ct);
        return Accepted();
    }

    /// <summary>Loads images from an uploaded tar archive (equivalent to <c>docker load</c>).</summary>
    [HttpPost("import")]
    [DisableRequestSizeLimit]
    [RequestFormLimits(MultipartBodyLengthLimit = long.MaxValue)]
    public async Task<IActionResult> Import(IFormFile file, CancellationToken ct)
    {
        if (file is null || file.Length == 0)
        {
            return ValidationProblem("A non-empty tar archive file is required.");
        }

        await using var stream = file.OpenReadStream();
        await _imageService.ImportAsync(stream, ct);
        return Accepted();
    }

    [HttpPost("{id}/tag")]
    public async Task<IActionResult> Tag(string id, [FromBody] TagImageRequest request, CancellationToken ct)
    {
        await _imageService.TagAsync(id, request, ct);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(
        string id,
        [FromQuery] bool force,
        [FromQuery] bool noprune,
        CancellationToken ct)
    {
        await _imageService.DeleteAsync(id, force, noprune, ct);
        return NoContent();
    }

    [HttpPost("prune")]
    public async Task<ActionResult<PruneResultDto>> Prune(CancellationToken ct)
    {
        var result = await _imageService.PruneAsync(ct);
        return Ok(result);
    }
}
