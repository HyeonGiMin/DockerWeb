using DockerWeb.Api.Models;

namespace DockerWeb.Api.Docker;

/// <summary>Maps internal connection state to API DTOs.</summary>
public static class ConnectionMapping
{
    public static ConnectionInfoDto ToDto(this DockerConnectionInfo info) =>
        new(info.Mode.ToString(), info.Endpoint, info.TlsEnabled);
}
