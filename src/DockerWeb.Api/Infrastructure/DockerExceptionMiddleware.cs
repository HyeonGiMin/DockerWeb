using System.Net;
using Docker.DotNet;
using Microsoft.AspNetCore.Mvc;

namespace DockerWeb.Api.Infrastructure;

/// <summary>
/// Translates Docker.DotNet and transport exceptions into RFC 7807 ProblemDetails
/// responses with appropriate HTTP status codes. Errors are logged with context.
/// </summary>
public sealed class DockerExceptionMiddleware
{
    private const int StatusClientClosedRequest = 499;

    private readonly RequestDelegate _next;
    private readonly ILogger<DockerExceptionMiddleware> _logger;

    public DockerExceptionMiddleware(RequestDelegate next, ILogger<DockerExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleAsync(context, ex);
        }
    }

    private async Task HandleAsync(HttpContext context, Exception exception)
    {
        var (status, title) = Classify(exception);

        if (status >= StatusCodes.Status500InternalServerError)
        {
            _logger.LogError(exception, "Unhandled error on {Method} {Path}",
                context.Request.Method, context.Request.Path);
        }
        else
        {
            _logger.LogWarning(exception, "Request error on {Method} {Path}: {Title}",
                context.Request.Method, context.Request.Path, title);
        }

        if (context.Response.HasStarted)
        {
            _logger.LogWarning("Response already started; cannot write ProblemDetails.");
            return;
        }

        var problem = new ProblemDetails
        {
            Title = title,
            Detail = exception.Message,
            Status = status,
            Instance = context.Request.Path,
        };

        context.Response.Clear();
        context.Response.StatusCode = status;
        context.Response.ContentType = "application/problem+json";
        await context.Response.WriteAsJsonAsync(problem);
    }

    private static (int Status, string Title) Classify(Exception exception) => exception switch
    {
        DockerContainerNotFoundException => (StatusCodes.Status404NotFound, "Container not found"),
        DockerImageNotFoundException => (StatusCodes.Status404NotFound, "Image not found"),
        DockerNetworkNotFoundException => (StatusCodes.Status404NotFound, "Network not found"),
        DockerApiException api => MapApiException(api),
        InvalidOperationException => (StatusCodes.Status400BadRequest, "Invalid operation"),
        ArgumentException => (StatusCodes.Status400BadRequest, "Invalid argument"),
        TimeoutException => (StatusCodes.Status502BadGateway, "Docker engine timeout"),
        HttpRequestException => (StatusCodes.Status502BadGateway, "Docker engine unreachable"),
        OperationCanceledException => (StatusClientClosedRequest, "Request cancelled"),
        _ => (StatusCodes.Status500InternalServerError, "Internal server error"),
    };

    private static (int Status, string Title) MapApiException(DockerApiException api) => api.StatusCode switch
    {
        HttpStatusCode.NotFound => (StatusCodes.Status404NotFound, "Docker resource not found"),
        HttpStatusCode.Conflict => (StatusCodes.Status409Conflict, "Docker resource conflict"),
        HttpStatusCode.BadRequest => (StatusCodes.Status400BadRequest, "Invalid Docker request"),
        HttpStatusCode.NotModified => (StatusCodes.Status409Conflict, "Docker resource not modified"),
        _ => ((int)api.StatusCode is >= 500 and < 600
            ? StatusCodes.Status502BadGateway
            : (int)api.StatusCode, "Docker engine error"),
    };
}
