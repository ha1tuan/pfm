using Microsoft.Extensions.DependencyInjection;

namespace FFM.Infrastructure.DependencyInjection;

public static class WorkerServicesExtensions
{
    /// <summary>
    /// Background work that only FFM.Worker runs: outbox publisher, consumers, scheduled jobs.
    /// FFM.Api never calls this, so those hosted services never start in the HTTP process.
    /// </summary>
    public static IServiceCollection AddWorkerServices(this IServiceCollection services)
    {
        return services;
    }
}
