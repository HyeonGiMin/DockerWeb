using Docker.DotNet.Models;
using DockerWeb.Api.Models;

namespace DockerWeb.Api.Services;

/// <summary>Operations against Docker images.</summary>
public interface IImageService
{
    Task<IReadOnlyList<ImageDto>> ListAsync(CancellationToken ct);

    Task<ImageInspectResponse> InspectAsync(string id, CancellationToken ct);

    Task PullAsync(PullImageRequest request, CancellationToken ct);

    /// <summary>Loads images from a tar archive stream (equivalent to <c>docker load</c>).</summary>
    Task ImportAsync(Stream tarStream, CancellationToken ct);

    Task TagAsync(string id, TagImageRequest request, CancellationToken ct);

    Task DeleteAsync(string id, bool force, bool noPrune, CancellationToken ct);

    Task<PruneResultDto> PruneAsync(CancellationToken ct);
}
