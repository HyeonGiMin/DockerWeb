using System.Net.Http;
using System.Security.Cryptography.X509Certificates;
using Docker.DotNet;
using Microsoft.Net.Http.Client;

namespace DockerWeb.Api.Docker;

/// <summary>
/// TLS credentials backed by a client X.509 certificate. The pinned Docker.DotNet
/// build (3.125.15) does not ship a <c>Docker.DotNet.X509.CertificateCredentials</c>
/// type, so this provides the equivalent by attaching the client certificate to the
/// underlying <see cref="ManagedHandler"/>.
/// </summary>
public sealed class CertificateCredentials : Credentials
{
    private readonly X509Certificate2 _certificate;

    public CertificateCredentials(X509Certificate2 certificate)
    {
        _certificate = certificate ?? throw new ArgumentNullException(nameof(certificate));
    }

    public override bool IsTlsCredentials() => true;

    public override HttpMessageHandler GetHandler(HttpMessageHandler innerHandler)
    {
        if (innerHandler is ManagedHandler managed)
        {
            managed.ClientCertificates ??= new X509CertificateCollection();
            managed.ClientCertificates.Add(_certificate);
        }

        return innerHandler;
    }

    public override void Dispose()
    {
        _certificate.Dispose();
        base.Dispose();
    }
}
