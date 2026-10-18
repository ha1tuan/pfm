using DotNet.Testcontainers.Containers;
using Testcontainers.PostgreSql;
using Testcontainers.RabbitMq;
using Testcontainers.Redis;

[assembly: AssemblyFixture(typeof(FFM.Api.IntegrationTests.Infrastructure))]

namespace FFM.Api.IntegrationTests;

/// <summary>Real PostgreSQL, RabbitMQ and Redis for the whole test run.</summary>
public sealed class Infrastructure : IAsyncLifetime
{
    public PostgreSqlContainer Postgres { get; } = new PostgreSqlBuilder("postgres:17-alpine").Build();

    public RabbitMqContainer RabbitMq { get; } = new RabbitMqBuilder("rabbitmq:4-management-alpine").Build();

    public RedisContainer Redis { get; } = new RedisBuilder("redis:7-alpine").Build();

    public IContainer this[string dependency] => dependency switch
    {
        "postgres" => Postgres,
        "rabbitmq" => RabbitMq,
        "redis" => Redis,
        _ => throw new ArgumentOutOfRangeException(nameof(dependency), dependency, null),
    };

    public async ValueTask InitializeAsync() =>
        await Task.WhenAll(Postgres.StartAsync(), RabbitMq.StartAsync(), Redis.StartAsync());

    public async ValueTask DisposeAsync()
    {
        await Postgres.DisposeAsync();
        await RabbitMq.DisposeAsync();
        await Redis.DisposeAsync();
    }
}

/// <summary>Tests that pause shared containers; xUnit runs this collection alone.</summary>
[CollectionDefinition(Name, DisableParallelization = true)]
public sealed class PausesContainers
{
    public const string Name = "Pauses containers";
}
