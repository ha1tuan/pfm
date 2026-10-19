using FFM.BuildingBlocks.Options;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Npgsql;
using RabbitMQ.Client;
using StackExchange.Redis;

namespace FFM.BuildingBlocks.Infrastructure;

public static class InfrastructureExtensions
{
    /// <summary>Connections to PostgreSQL, RabbitMQ and Redis shared by every module in a host.</summary>
    public static IServiceCollection AddInfrastructure(this IServiceCollection services)
    {
        services.AddValidatedOptions<ConnectionStringsOptions>(ConnectionStringsOptions.SectionName);

        services.AddSingleton(sp =>
            NpgsqlDataSource.Create(sp.GetRequiredService<IOptions<ConnectionStringsOptions>>().Value.Postgres));

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
