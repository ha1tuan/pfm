using FFM.Domain.Entities.Identity;
using FFM.Domain.ValueObjects;
using FFM.Infrastructure.Data.Conversions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FFM.Infrastructure.Data.Configurations.Identity;

internal sealed class SmsOtpChallengeConfiguration : IEntityTypeConfiguration<SmsOtpChallenge>
{
    public void Configure(EntityTypeBuilder<SmsOtpChallenge> challenge)
    {
        challenge.ToTable("sms_otp_challenges", Schemas.Identity, t =>
            t.HasCheckConstraint(
                "ck_sms_otp_challenges_purpose",
                $"purpose IN ({CamelCaseEnumConverter<SmsOtpPurpose>.SqlValues()})"));

        challenge.HasKey(c => c.Id);
        challenge.Property(c => c.Id).ValueGeneratedNever();
        challenge.Property(c => c.Phone).HasConversion(p => p.Value, s => PhoneNumber.Parse(s)).IsRequired();
        challenge.Property(c => c.Purpose).HasConversion(new CamelCaseEnumConverter<SmsOtpPurpose>());
        challenge.Property(c => c.CodeHash).IsRequired();
    }
}
