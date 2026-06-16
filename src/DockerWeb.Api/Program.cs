using System.Text.Json.Serialization;
using DockerWeb.Api.Configuration;
using DockerWeb.Api.Docker;
using DockerWeb.Api.Hubs;
using DockerWeb.Api.Infrastructure;
using DockerWeb.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;

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

// Single-admin auth options + token issuer. The TokenService owns the signing
// key; JwtBearer below reuses that SAME key instance for validation.
var authOptions = builder.Configuration
    .GetSection(AuthOptions.SectionName)
    .Get<AuthOptions>() ?? new AuthOptions();

builder.Services.AddSingleton(authOptions);

// Construct the token service eagerly so its signing key exists before we wire
// JwtBearer validation, then register that SAME instance as the singleton.
// This guarantees signing (TokenService) and validation (JwtBearer) share one key.
using var bootstrapLoggerFactory = LoggerFactory.Create(logging =>
    logging.AddConfiguration(builder.Configuration.GetSection("Logging")).AddConsole());
var tokenService = new TokenService(
    authOptions,
    bootstrapLoggerFactory.CreateLogger<TokenService>());
builder.Services.AddSingleton<ITokenService>(tokenService);

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new()
        {
            ValidateIssuer = true,
            ValidIssuer = TokenService.Issuer,
            ValidateAudience = true,
            ValidAudience = TokenService.Audience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = tokenService.SigningKey,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromSeconds(30),
        };

        // SignalR WebSockets cannot send an Authorization header, so accept the
        // token from the access_token query string for /hubs routes only.
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = ctx =>
            {
                var token = ctx.Request.Query["access_token"];
                var path = ctx.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(token) && path.StartsWithSegments("/hubs"))
                {
                    ctx.Token = token;
                }

                return Task.CompletedTask;
            },
        };
    });

builder.Services.AddAuthorization();

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

app.UseAuthentication();
app.UseAuthorization();

// Static files + SPA shell stay anonymous so the login page can load.
app.UseDefaultFiles();
app.UseStaticFiles();

// All API endpoints require auth; AuthController stays public via [AllowAnonymous].
app.MapControllers().RequireAuthorization();
app.MapHub<MonitorHub>("/hubs/monitor").RequireAuthorization();

// SPA fallback must be last so /api and /hubs routes win. Anonymous so the
// login page + app shell are reachable without a token.
app.MapFallbackToFile("index.html");

app.Run();
