using Microsoft.Extensions.DependencyInjection;

namespace FFM.Infrastructure.Health;

public static class HealthCheckExtensions
{
    /// <summary>Tag of the checks that /health/ready runs.</summary>
    public const string ReadyTag = "ready";

    private static readonly TimeSpan CheckTimeout = TimeSpan.FromSeconds(3);

    /// <summary>Readiness checks for PostgreSQL, RabbitMQ and Redis. Requires AddInfrastructure.</summary>
    public static IServiceCollection AddDependencyHealthChecks(this IServiceCollection services)
    {
        services.AddHealthChecks()
            .AddCheck<PostgresHealthCheck>("postgres", tags: [ReadyTag], timeout: CheckTimeout)
            .AddCheck<RabbitMqHealthCheck>("rabbitmq", tags: [ReadyTag], timeout: CheckTimeout)
            .AddCheck<RedisHealthCheck>("redis", tags: [ReadyTag], timeout: CheckTimeout);
        return services;
    }
}
