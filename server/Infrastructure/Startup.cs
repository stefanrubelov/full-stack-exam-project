using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Mqtt.Controllers;
using NSwag;
using NSwag.Generation.Processors.Security;
using server.Entities;
using server.Features.Auth.Contracts;
using server.Features.Auth.Services;
using server.Repositories;
using StateleSSE.AspNetCore;
using StateleSSE.AspNetCore.GroupRealtime;
using Testcontainers.PostgreSql;

namespace server.Infrastructure;

public class Startup
{
    private readonly IConfiguration _configuration;
    private readonly ConnectionStrings _connectionStrings;

    public Startup(IConfiguration configuration)
    {
        _configuration = configuration;
        _connectionStrings = ResolveConnectionStrings(configuration);
    }

    public void ConfigureServices(IServiceCollection services)
    {
        services.AddSingleton(_connectionStrings);

        AddAuthentication(services);
        AddDatabase(services);
        AddMiscellaneous(services);
    }

    public async Task Configure(WebApplication app)
    {
        app.UseExceptionHandler();
        app.UseCors(c => c
            .AllowAnyHeader()
            .AllowAnyMethod()
            .WithOrigins(
                "https://full-stack-exam-project.vercel.app",
                "http://localhost:5173"
            ));
        app.UseOpenApi();
        app.UseSwaggerUi();
        app.UseAuthentication();
        app.UseAuthorization();
        app.MapControllers();
        app.UseStaticFiles();

        await ConnectMqtt(app);

        if (app.Environment.IsDevelopment())
            await app.GenerateApiClientsFromOpenApi("../client/src/generated-ts-client.ts", "./openapi.json");

        SeedDatabase(app);
        if (app.Environment.IsDevelopment())
            SeedHistoricalData(app);
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    private static ConnectionStrings ResolveConnectionStrings(IConfiguration configuration)
    {
        var connectionStrings = new ConnectionStrings();
        configuration.GetSection(nameof(ConnectionStrings)).Bind(connectionStrings);

        if (string.IsNullOrWhiteSpace(connectionStrings.DbConnectionString))
        {
            var container = new PostgreSqlBuilder("postgres:15.1").Build();
            container.StartAsync().GetAwaiter().GetResult();
            connectionStrings.DbConnectionString = container.GetConnectionString();
        }

        return connectionStrings;
    }

    private void AddAuthentication(IServiceCollection services)
    {
        services
            .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(o => o.TokenValidationParameters = JwtService.CreateValidationParams(_configuration));

        services.AddAuthorization();
    }

    private void AddDatabase(IServiceCollection services)
    {
        services.AddDbContext<MyDbContext>((sp, conf) =>
        {
            conf.UseNpgsql(_connectionStrings.DbConnectionString);
            conf.AddEfRealtimeInterceptor(sp);
        });
    }

    private static void AddMiscellaneous(IServiceCollection services)
    {
        services.Configure<HostOptions>(opts => opts.ShutdownTimeout = TimeSpan.FromSeconds(0));

        services.AddInMemorySseBackplane();
        services.AddEfRealtime();
        services.AddGroupRealtime();

        services.AddOpenApiDocument(config =>
        {
            config.AddSecurity("Bearer", new OpenApiSecurityScheme
            {
                Type = OpenApiSecuritySchemeType.Http,
                Scheme = "bearer",
                BearerFormat = "JWT",
                Description = "Enter your JWT token"
            });
            config.OperationProcessors.Add(new AspNetCoreOperationSecurityScopeProcessor("Bearer"));
        });

        services.AddProblemDetails(options =>
        {
            options.CustomizeProblemDetails = context =>
            {
                var exception = context.HttpContext.Features.Get<IExceptionHandlerFeature>()?.Error;
                if (exception != null)
                    context.ProblemDetails.Detail = exception.Message;
            };
        });

        // Auth services
        services.AddScoped<IPasswordHasher<User>, PasswordHasherService>();
        services.AddScoped<IBaseRepository<User>, UserRepository>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<ITokenService, JwtService>();

        services.AddMqttControllers();

        services.AddControllers().AddJsonOptions(options =>
        {
            options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
            options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
            options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
        });

        services.AddCors();
        services.AddScoped<Seeder>();
        services.AddScoped<HistoricalDataSeeder>();
    }

    private async Task ConnectMqtt(WebApplication app)
    {
        var logger = app.Services.GetRequiredService<ILogger<Startup>>();
        try
        {
            var mqttClient = app.Services.GetRequiredService<IMqttClientService>();
            await mqttClient.ConnectAsync(
                _connectionStrings.MqttBroker,
                _connectionStrings.MqttPort,
                username: "",
                password: "");
        }
        catch (Exception ex)
        {
            logger.LogWarning("MQTT connection failed: {Message}. The server will start without real-time telemetry.", ex.Message);
        }
    }

    private static void SeedDatabase(WebApplication app)
    {
        using var scope = app.Services.CreateScope();
        scope.ServiceProvider.GetRequiredService<Seeder>().Seed();
    }

    private static void SeedHistoricalData(WebApplication app)
    {
        using var scope = app.Services.CreateScope();
        scope.ServiceProvider.GetRequiredService<HistoricalDataSeeder>().Seed();
    }
}
