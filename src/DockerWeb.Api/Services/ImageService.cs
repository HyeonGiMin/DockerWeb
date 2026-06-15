using Docker.DotNet.Models;
using DockerWeb.Api.Docker;
using DockerWeb.Api.Models;

namespace DockerWeb.Api.Services;

/// <inheritdoc cref="IImageService" />
public sealed class ImageService : IImageService
{
    private const string NoneTag = "<none>:<none>";

    private readonly IDockerConnectionManager _manager;
    private readonly ILogger<ImageService> _logger;

    public ImageService(IDockerConnectionManager manager, ILogger<ImageService> logger)
    {
        _manager = manager;
        _logger = logger;
    }

    public async Task<IReadOnlyList<ImageDto>> ListAsync(CancellationToken ct)
    {
        var images = await _manager.Client.Images.ListImagesAsync(
            new ImagesListParameters { All = true }, ct);

        return images.Select(Map).ToList();
    }

    public Task<ImageInspectResponse> InspectAsync(string id, CancellationToken ct)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(id);
        return _manager.Client.Images.InspectImageAsync(id, ct);
    }

    public async Task PullAsync(PullImageRequest request, CancellationToken ct)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(request.Image);
        var tag = string.IsNullOrWhiteSpace(request.Tag) ? "latest" : request.Tag;

        _logger.LogInformation("Pulling image {Image}:{Tag}", request.Image, tag);

        await _manager.Client.Images.CreateImageAsync(
            new ImagesCreateParameters { FromImage = request.Image, Tag = tag },
            authConfig: null,
            new Progress<JSONMessage>(_ => { }),
            ct);
    }

    public async Task ImportAsync(Stream tarStream, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(tarStream);

        _logger.LogInformation("Importing images from tar archive (docker load)");

        await _manager.Client.Images.LoadImageAsync(
            new ImageLoadParameters { Quiet = true },
            tarStream,
            new Progress<JSONMessage>(_ => { }),
            ct);
    }

    public Task TagAsync(string id, TagImageRequest request, CancellationToken ct)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(id);
        ArgumentException.ThrowIfNullOrWhiteSpace(request.Repository);

        return _manager.Client.Images.TagImageAsync(
            id,
            new ImageTagParameters { RepositoryName = request.Repository, Tag = request.Tag },
            ct);
    }

    public Task DeleteAsync(string id, bool force, bool noPrune, CancellationToken ct)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(id);
        _logger.LogInformation("Deleting image {Image} (force={Force})", id, force);

        return _manager.Client.Images.DeleteImageAsync(
            id,
            new ImageDeleteParameters { Force = force, NoPrune = noPrune },
            ct);
    }

    public async Task<PruneResultDto> PruneAsync(CancellationToken ct)
    {
        var response = await _manager.Client.Images.PruneImagesAsync(new ImagesPruneParameters(), ct);
        var deleted = response.ImagesDeleted?.Count ?? 0;
        return new PruneResultDto(deleted, (long)response.SpaceReclaimed);
    }

    private static ImageDto Map(ImagesListResponse image)
    {
        var repoTags = image.RepoTags is { Count: > 0 }
            ? image.RepoTags
            : new List<string>();

        var dangling = repoTags.Count == 0 || repoTags.All(t => t == NoneTag);
        var labels = image.Labels ?? new Dictionary<string, string>();

        return new ImageDto(
            image.ID,
            repoTags.ToList(),
            image.Size,
            image.Created,
            dangling,
            new Dictionary<string, string>(labels));
    }
}
