using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace FFM.Infrastructure.Data;

internal static class FfmDbContextOptions
{
    public const string MigrationsHistoryTable = "__ef_migrations";

    /// <summary>Shared by the hosts and the design-time factory, so migrations see the same model.</summary>
    public static DbContextOptionsBuilder Configure(DbContextOptionsBuilder options, NpgsqlDataSource dataSource) =>
        options
            .UseNpgsql(dataSource, npgsql => npgsql.MigrationsHistoryTable(MigrationsHistoryTable, "public"))
            .UseSnakeCaseNamingConvention();
}
