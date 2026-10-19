using FFM.Application.Interfaces;
using FFM.Infrastructure.Common;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Npgsql;
using RabbitMQ.Client;
using StackExchange.Redis;

namespace FFM.Infrastructure.DependencyInjection;

public static class InfrastructureExtensions
{
    /// <summary>
    /// Implementations of the Application interfaces plus what every host shares:
    /// clock, id generator, and the PostgreSQL, RabbitMQ and Redis connections.
    /// </summary>
    public static IServiceCollection AddInfrastructure(this IServiceCollection services)
    {
        services.TryAddSingleton(TimeProvider.System);
        services.TryAddSingleton<IIdGenerator, UuidV7Generator>();

        services.AddValidatedOptions<ConnectionStringsOptions>(ConnectionStringsOptions.SectionName);

        services.AddSingleton(sp =>
            new NpgsqlDataSourceBuilder(sp.GetRequiredService<IOptions<ConnectionStringsOptions>>().Value.Postgres)
                .UseLoggerFactory(sp.GetRequiredService<ILoggerFactory>())
                .Build());

        services.AddSingleton<IConnectionMultiplexer>(sp =>
        {
            var redis = ConfigurationOptions.Parse(sp.GetRequiredService<IOptions<ConnectionStringsOptions>>().Value.Redis);
            redis.AbortOnConnectFail = false;
            return ConnectionMultiplexer.Connect(redis);
        });

        services.AddSingleton<IConnectionFactory>(sp => new ConnectionFactory
        {
            Uri = new Uri(sp.GetRequiredService<IOptions<ConnectionStringsOptions>>().Value.RabbitMq),
        });

        return services;
    }
}
