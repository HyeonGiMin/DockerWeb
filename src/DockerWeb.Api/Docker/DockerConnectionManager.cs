using System.Security.Cryptography.X509Certificates;
using Docker.DotNet;
using DockerWeb.Api.Configuration;

namespace DockerWeb.Api.Docker;

/// <summary>Describes the active Docker connection.</summary>
public sealed record DockerConnectionInfo(DockerConnectionMode Mode, string Endpoint, bool TlsEnabled);

/// <summary>
/// Holds the live <see cref="DockerClient"/> and allows swapping the connection
/// (Local named pipe / Remote TCP+TLS) at runtime. Registered as a singleton.
/// </summary>
public interface IDockerConnectionManager
{
    /// <summary>The current Docker client. Do not cache; read per call.</summary>
    DockerClient Client { get; }

    /// <summary>Metadata describing the active connection.</summary>
    DockerConnectionInfo Current { get; }

    /// <summary>Rebuilds the client from new options, disposing the previous one.</summary>
    void Reconfigure(DockerOptions options);
}

/// <inheritdoc cref="IDockerConnectionManager" />
public sealed class DockerConnectionManager : IDockerConnectionManager, IDisposable
{
    private readonly object _gate = new();
    private readonly ILogger<DockerConnectionManager> _logger;
    private DockerClient _client;
    private DockerConnectionInfo _current;
    private bool _disposed;

    public DockerConnectionManager(DockerOptions options, ILogger<DockerConnectionManager> logger)
    {
        _logger = logger;
        (_client, _current) = Build(options);
        _logger.LogInformation(
            "Docker client initialized: mode={Mode} endpoint={Endpoint} tls={Tls}",
            _current.Mode, _current.Endpoint, _current.TlsEnabled);
    }

    public DockerClient Client
    {
        get
        {
            lock (_gate)
            {
                ObjectDisposedException.ThrowIf(_disposed, this);
                return _client;
            }
        }
    }

    public DockerConnectionInfo Current
    {
        get
        {
            lock (_gate)
            {
                return _current;
            }
        }
    }

    public void Reconfigure(DockerOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);
        var (newClient, newInfo) = Build(options);

        DockerClient? old;
        lock (_gate)
        {
            ObjectDisposedException.ThrowIf(_disposed, this);
            old = _client;
            _client = newClient;
            _current = newInfo;
        }

        old?.Dispose();
        _logger.LogInformation(
            "Docker client reconfigured: mode={Mode} endpoint={Endpoint} tls={Tls}",
            newInfo.Mode, newInfo.Endpoint, newInfo.TlsEnabled);
    }

    private static (DockerClient Client, DockerConnectionInfo Info) Build(DockerOptions options)
    {
        var (uri, tlsEnabled) = ResolveEndpoint(options);
        Credentials? credentials = LoadCredentials(options, tlsEnabled);

        var config = credentials is null
            ? new DockerClientConfiguration(uri, defaultTimeout: options.DefaultTimeout)
            : new DockerClientConfiguration(uri, credentials, defaultTimeout: options.DefaultTimeout);

        var info = new DockerConnectionInfo(options.Mode, uri.ToString(), tlsEnabled);
        return (config.CreateClient(), info);
    }

    private static (Uri Uri, bool TlsEnabled) ResolveEndpoint(DockerOptions options)
    {
        if (options.Mode == DockerConnectionMode.Local)
        {
            return (new Uri(options.LocalEndpoint), false);
        }

        if (string.IsNullOrWhiteSpace(options.RemoteEndpoint))
        {
            throw new InvalidOperationException(
                "RemoteEndpoint must be configured when Docker connection mode is Remote.");
        }

        return (new Uri(options.RemoteEndpoint), options.Tls.Enabled);
    }

    private static Credentials? LoadCredentials(DockerOptions options, bool tlsEnabled)
    {
        if (options.Mode != DockerConnectionMode.Remote || !tlsEnabled)
        {
            return null;
        }

        if (string.IsNullOrWhiteSpace(options.Tls.ClientCertPath))
        {
            return null;
        }

        var cert = X509CertificateLoader.LoadPkcs12FromFile(
            options.Tls.ClientCertPath,
            options.Tls.ClientCertPassword);

        return new CertificateCredentials(cert);
    }

    public void Dispose()
    {
        lock (_gate)
        {
            if (_disposed)
            {
                return;
            }

            _disposed = true;
            _client.Dispose();
        }
    }
}
