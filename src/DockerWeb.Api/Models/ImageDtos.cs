namespace DockerWeb.Api.Models;

/// <summary>A Docker image as listed by the engine.</summary>
public sealed record ImageDto(
    string Id,
    IReadOnlyList<string> RepoTags,
    long Size,
    DateTime Created,
    bool Dangling,
    IReadOnlyDictionary<string, string> Labels);

/// <summary>Request to pull an image from a registry.</summary>
public sealed record PullImageRequest(string Image, string? Tag);

/// <summary>Request to add a new tag to an existing image.</summary>
public sealed record TagImageRequest(string Repository, string Tag);

/// <summary>Result of a prune operation.</summary>
public sealed record PruneResultDto(int DeletedCount, long SpaceReclaimed);
