using FFM.Domain.Entities.Identity;
using FFM.Infrastructure.Data.Conversions;
using FFM.Infrastructure.Data.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FFM.Infrastructure.Data.Configurations.Identity;

internal sealed class UserIdentityConfiguration : IEntityTypeConfiguration<UserIdentity>
{
    public void Configure(EntityTypeBuilder<UserIdentity> user)
    {
        user.ToTable("users", Schemas.Identity, t =>
        {
            t.HasCheckConstraint("ck_users_kyc_level", "kyc_level IN (1, 2)");
            t.HasCheckConstraint("ck_users_status", $"status IN ({CamelCaseEnumConverter<UserStatus>.SqlValues()})");
        });

        // One phone, one User: the unique index is what settles concurrent registrations.
        user.Property(u => u.PhoneNumber).HasColumnName("phone").IsRequired();
        user.HasIndex(u => u.PhoneNumber).IsUnique();

        user.Property(u => u.FullName).HasMaxLength(100).IsRequired();
        user.Property(u => u.Status).HasConversion(new CamelCaseEnumConverter<UserStatus>());

        // Identity names these itself (EmailIndex, fk_…_asp_net_users_…); keep them in the project's convention.
        user.HasIndex(u => u.NormalizedUserName).HasDatabaseName("ix_users_normalized_user_name");
        user.HasIndex(u => u.NormalizedEmail).HasDatabaseName("ix_users_normalized_email");
        user.HasMany<IdentityUserClaim<Guid>>().WithOne().HasForeignKey(c => c.UserId)
            .HasConstraintName("fk_user_claims_users_user_id");
    }
}

internal sealed class UserClaimConfiguration : IEntityTypeConfiguration<IdentityUserClaim<Guid>>
{
    public void Configure(EntityTypeBuilder<IdentityUserClaim<Guid>> claim) => claim.ToTable("user_claims", Schemas.Identity);
}

internal sealed class UserLoginConfiguration : IEntityTypeConfiguration<IdentityUserLogin<Guid>>
{
    public void Configure(EntityTypeBuilder<IdentityUserLogin<Guid>> login) => login.ToTable("user_logins", Schemas.Identity);
}

internal sealed class UserTokenConfiguration : IEntityTypeConfiguration<IdentityUserToken<Guid>>
{
    public void Configure(EntityTypeBuilder<IdentityUserToken<Guid>> token) => token.ToTable("user_tokens", Schemas.Identity);
}
