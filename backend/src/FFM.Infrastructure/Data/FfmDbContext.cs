using FFM.Domain.Entities.Identity;
using FFM.Infrastructure.Data.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace FFM.Infrastructure.Data;

/// <summary>
/// The one DbContext for every feature schema (ADR-0004). Derives from <see cref="IdentityUserContext{TUser,TKey}"/>
/// so ASP.NET Core Identity stores Users here too; Staff do not use Identity stores (one TUser per context).
/// </summary>
public sealed class FfmDbContext(DbContextOptions<FfmDbContext> options)
    : IdentityUserContext<UserIdentity, Guid>(options)
{
    public DbSet<SmsOtpChallenge> SmsOtpChallenges => Set<SmsOtpChallenge>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        // Identity first, so Configurations/ can rename its tables into the identity schema.
        base.OnModelCreating(builder);
        builder.ApplyConfigurationsFromAssembly(typeof(FfmDbContext).Assembly);
    }
}
