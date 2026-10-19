using System.Text.Json;
using FFM.Infrastructure.Health;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace FFM.Api.Endpoints;

internal static class HealthEndpoints
{
    public static IEndpointRouteBuilder MapHealthEndpoints(this IEndpointRouteBuilder endpoints)
    {
        // Liveness: the process answers; no dependency is checked.
        endpoints.MapHealthChecks("/health/live", new HealthCheckOptions { Predicate = _ => false, ResponseWriter = WriteAsync });
        endpoints.MapHealthChecks("/health/ready", new HealthCheckOptions
        {
            Predicate = check => check.Tags.Contains(HealthCheckExtensions.ReadyTag),
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
