using FFM.Application.Interfaces;
using FFM.Application.UseCases.Identity;
using FFM.Domain.Interfaces;
using FFM.Infrastructure.Common;
using FFM.Infrastructure.Data;
using FFM.Infrastructure.Data.Queries.Identity;
using FFM.Infrastructure.Data.Repositories.Identity;
using FFM.Infrastructure.External.Sms;
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
    /// clock, id generator, the PostgreSQL, RabbitMQ and Redis connections, the DbContext and provider adapters.
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

        services.AddPersistence();
        services.AddIdentityFeature();
        services.AddSms();

        return services;
    }

    private static void AddPersistence(this IServiceCollection services)
    {
        services.AddDbContext<FfmDbContext>((sp, options) =>
            FfmDbContextOptions.Configure(options, sp.GetRequiredService<NpgsqlDataSource>()));
        services.AddScoped<IUnitOfWork, UnitOfWork>();
    }

    private static void AddIdentityFeature(this IServiceCollection services)
    {
        // Application owns SmsOtpOptions but may not reference Microsoft.Extensions.Options; it receives the value.
        services.AddValidatedOptions<SmsOtpOptions>(SmsOtpOptions.SectionName);
        services.AddSingleton(sp => sp.GetRequiredService<IOptions<SmsOtpOptions>>().Value);

        services.AddScoped<ISmsOtpChallengeRepository, SmsOtpChallengeRepository>();
        services.AddScoped<IUserDirectory, UserDirectory>();
    }

    private static void AddSms(this IServiceCollection services)
    {
        services.AddValidatedOptions<SmsOptions>(SmsOptions.SectionName);
        services.AddKeyedSingleton<ISmsSender, MockSmsSender>(MockSmsSender.Mode);
        services.AddSingleton(sp => sp.GetRequiredKeyedService<ISmsSender>(
            sp.GetRequiredService<IOptions<SmsOptions>>().Value.Mode));
    }
}
