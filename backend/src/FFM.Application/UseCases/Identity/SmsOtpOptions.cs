using System.ComponentModel.DataAnnotations;

namespace FFM.Application.UseCases.Identity;

/// <summary>SMS OTP rules for registration and device binding. Bound and validated by Infrastructure.</summary>
public sealed class SmsOtpOptions
{
    public const string SectionName = "SmsOtp";

    [Range(4, 8)]
    public int Length { get; init; } = 6;

    [Range(typeof(TimeSpan), "00:01:00", "00:15:00")]
    public TimeSpan Lifetime { get; init; } = TimeSpan.FromMinutes(5);
}
