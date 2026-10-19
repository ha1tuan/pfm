using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Npgsql;

namespace FFM.Infrastructure.Data;

/// <summary>
/// Lets <c>dotnet ef migrations add &lt;Name&gt; --project src/FFM.Infrastructure</c> build the model without a host.
/// Adding a migration never connects; the connection string only names the provider.
/// </summary>
internal sealed class FfmDbContextDesignTimeFactory : IDesignTimeDbContextFactory<FfmDbContext>
{
    public FfmDbContext CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<FfmDbContext>();
        FfmDbContextOptions.Configure(options, NpgsqlDataSource.Create("Host=localhost;Database=ffm"));
        return new FfmDbContext(options.Options);
    }
}
