using System.Text.Json;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace FFM.BuildingBlocks.Health;

public static class HealthEndpoints
{
    private const string ReadyTag = "ready";
    private static readonly TimeSpan CheckTimeout = TimeSpan.FromSeconds(3);

    /// <summary>Readiness checks for PostgreSQL, RabbitMQ and Redis. Requires <c>AddInfrastructure</c>.</summary>
    public static IServiceCollection AddDependencyHealthChecks(this IServiceCollection services)
    {
        services.AddHealthChecks()
            .AddCheck<PostgresHealthCheck>("postgres", tags: [ReadyTag], timeout: CheckTimeout)
            .AddCheck<RabbitMqHealthCheck>("rabbitmq", tags: [ReadyTag], timeout: CheckTimeout)
            .AddCheck<RedisHealthCheck>("redis", tags: [ReadyTag], timeout: CheckTimeout);
        return services;
    }

    public static IEndpointRouteBuilder MapHealthEndpoints(this IEndpointRouteBuilder endpoints)
    {
        // Liveness: the process answers; no dependency is checked.
        endpoints.MapHealthChecks("/health/live", new HealthCheckOptions { Predicate = _ => false, ResponseWriter = WriteAsync });
        endpoints.MapHealthChecks("/health/ready", new HealthCheckOptions
        {
            Predicate = check => check.Tags.Contains(ReadyTag),
            ResponseWriter = WriteAsync,
        });
        return endpoints;
    }

    private static Task WriteAsync(HttpContext context, HealthReport report) =>
        context.Response.WriteAsJsonAsync(
            new
            {
                status = report.Status.ToString(),
                entries = report.Entries.ToDictionary(e => e.Key, e => e.Value.Status.ToString()),
            },
            JsonSerializerOptions.Web);
}
