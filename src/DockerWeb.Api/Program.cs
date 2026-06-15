using System.Text.Json.Serialization;
using DockerWeb.Api.Configuration;
using DockerWeb.Api.Docker;
using DockerWeb.Api.Hubs;
using DockerWeb.Api.Infrastructure;
using DockerWeb.Api.Services;

var builder = WebApplication.CreateBuilder(args);

const string SpaCorsPolicy = "spa";
string[] spaOrigins = ["http://localhost:5173", "http://localhost:4173"];

// Strongly typed Docker options bound from the "Docker" section.
var dockerOptions = builder.Configuration
    .GetSection(DockerOptions.SectionName)
    .Get<DockerOptions>() ?? new DockerOptions();

builder.Services.Configure<DockerOptions>(
    builder.Configuration.GetSection(DockerOptions.SectionName));

// The connection manager owns the live DockerClient and is shared across requests.
builder.Services.AddSingleton(dockerOptions);
builder.Services.AddSingleton<IDockerConnectionManager, DockerConnectionManager>();

// Per-request Docker domain services.
builder.Services.AddScoped<IImageService, ImageService>();
builder.Services.AddScoped<IContainerService, ContainerService>();
builder.Services.AddScoped<IVolumeService, VolumeService>();
builder.Services.AddScoped<INetworkService, NetworkService>();
builder.Services.AddScoped<ISystemService, SystemService>();
builder.Services.AddScoped<IStatsService, StatsService>();

builder.Services
    .AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy =
            System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

builder.Services.AddSignalR();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(options =>
{
    options.AddPolicy(SpaCorsPolicy, policy =>
        policy
            .WithOrigins(spaOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials());
});

var app = builder.Build();

// Translate Docker exceptions to ProblemDetails before anything else runs.
app.UseMiddleware<DockerExceptionMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors(SpaCorsPolicy);

app.MapControllers();
app.MapHub<MonitorHub>("/hubs/monitor");

app.Run();
