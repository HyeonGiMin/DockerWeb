using DockerWeb.Api.Configuration;
using DockerWeb.Api.Docker;
using DockerWeb.Api.Models;
using DockerWeb.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace DockerWeb.Api.Controllers;

/// <summary>Runtime connection settings (switch Local / Remote).</summary>
[ApiController]
[Route("api/settings")]
public sealed class SettingsController : ControllerBase
{
    private readonly IDockerConnectionManager _manager;
    private readonly ISystemService _systemService;
    private readonly ILogger<SettingsController> _logger;

    public SettingsController(
        IDockerConnectionManager manager,
        ISystemService systemService,
        ILogger<SettingsController> logger)
    {
        _manager = manager;
        _systemService = systemService;
        _logger = logger;
    }

    [HttpGet("connection")]
    public ActionResult<ConnectionInfoDto> GetConnection()
    {
        return Ok(_manager.Current.ToDto());
    }

    [HttpPut("connection")]
    public async Task<ActionResult<PingResultDto>> UpdateConnection(
        [FromBody] UpdateConnectionRequest request,
        CancellationToken ct)
    {
        if (!Enum.TryParse<DockerConnectionMode>(request.Mode, ignoreCase: true, out var mode))
        {
            return BadRequest(new ProblemDetails
            {
                Title = "Invalid connection mode",
                Detail = $"Mode '{request.Mode}' is not valid. Use 'Local' or 'Remote'.",
                Status = StatusCodes.Status400BadRequest,
            });
        }

        var options = BuildOptions(mode, request);

        if (mode == DockerConnectionMode.Remote && string.IsNullOrWhiteSpace(options.RemoteEndpoint))
        {
            return BadRequest(new ProblemDetails
            {
                Title = "Missing remote endpoint",
                Detail = "RemoteEndpoint is required when mode is Remote.",
                Status = StatusCodes.Status400BadRequest,
            });
        }

        _manager.Reconfigure(options);
        var connection = _manager.Current.ToDto();

        try
        {
            var ok = await _systemService.PingAsync(ct);
            return Ok(new PingResultDto(ok, connection));
        }
        catch (Exception ex)
        {
            // Keep the new configuration but report the connection failure.
            _logger.LogWarning(ex, "Ping failed after switching to {Endpoint}", connection.Endpoint);
            return StatusCode(StatusCodes.Status502BadGateway, new ProblemDetails
            {
                Title = "Connection switched but ping failed",
                Detail = ex.Message,
                Status = StatusCodes.Status502BadGateway,
            });
        }
    }

    private static DockerOptions BuildOptions(DockerConnectionMode mode, UpdateConnectionRequest request)
    {
        var options = new DockerOptions { Mode = mode };

        if (!string.IsNullOrWhiteSpace(request.LocalEndpoint))
        {
            options.LocalEndpoint = request.LocalEndpoint;
        }

        options.RemoteEndpoint = request.RemoteEndpoint;

        if (request.Tls is { } tls)
        {
            options.Tls = new DockerTlsOptions
            {
                Enabled = tls.Enabled,
                ClientCertPath = tls.ClientCertPath,
                ClientCertPassword = tls.ClientCertPassword,
            };
        }

        return options;
    }
}
