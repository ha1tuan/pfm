using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace FFM.Infrastructure.Data;

public static class DatabaseMigrationExtensions
{
    /// <summary>Config key that makes the Api apply pending migrations at start (local and tests only).</summary>
    public const string MigrateOnStartupKey = "Database:MigrateOnStartup";

    public static async Task MigrateDatabaseAsync(this IHost host)
    {
        await using var scope = host.Services.CreateAsyncScope();
        await scope.ServiceProvider.GetRequiredService<FfmDbContext>().Database.MigrateAsync();
    }
}
