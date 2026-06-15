namespace DockerWeb.Api.Configuration;

/// <summary>How the API connects to a Docker Engine.</summary>
public enum DockerConnectionMode
{
    /// <summary>Local Docker Desktop via named pipe (Windows) or unix socket.</summary>
    Local,

    /// <summary>Remote Docker host over TCP, optionally secured with TLS.</summary>
    Remote,
}

/// <summary>
/// Bound from the "Docker" configuration section. Holds the connection
/// settings the <see cref="Docker.DockerConnectionManager"/> uses to build a client.
/// </summary>
public sealed class DockerOptions
{
    public const string SectionName = "Docker";

    public DockerConnectionMode Mode { get; set; } = DockerConnectionMode.Local;

    /// <summary>Local named-pipe / unix-socket endpoint.</summary>
    public string LocalEndpoint { get; set; } = "npipe://./pipe/docker_engine";

    /// <summary>Remote TCP endpoint, e.g. <c>tcp://192.168.0.10:2376</c>.</summary>
    public string? RemoteEndpoint { get; set; }

    /// <summary>TLS settings for remote connections.</summary>
    public DockerTlsOptions Tls { get; set; } = new();

    /// <summary>Default per-request timeout for the Docker client.</summary>
    public TimeSpan DefaultTimeout { get; set; } = TimeSpan.FromSeconds(100);
}

/// <summary>Client-side TLS options for securing a remote Docker connection.</summary>
public sealed class DockerTlsOptions
{
    public bool Enabled { get; set; }

    /// <summary>Path to a PKCS#12 (.pfx) client certificate bundle.</summary>
    public string? ClientCertPath { get; set; }

    public string? ClientCertPassword { get; set; }
}
