using System.Security.Cryptography;
using System.Text;
using FFM.Domain.ValueObjects;

namespace FFM.Domain.Entities.Identity;

public enum SmsOtpPurpose
{
    Register,
    DeviceBinding,
}

/// <summary>
/// One SMS OTP sent to a phone for one purpose. Only a hash of the code is kept; the code itself
/// leaves the system once, in the SMS.
/// </summary>
public sealed class SmsOtpChallenge
{
    private SmsOtpChallenge()
    {
    }

    public Guid Id { get; private set; }

    public PhoneNumber Phone { get; private set; } = null!;

    public SmsOtpPurpose Purpose { get; private set; }

    public string CodeHash { get; private set; } = string.Empty;

    public int Attempts { get; private set; }

    public DateTimeOffset ExpiresAt { get; private set; }

    public DateTimeOffset? ConsumedAt { get; private set; }

    public static SmsOtpChallenge Issue(
        Guid id, PhoneNumber phone, SmsOtpPurpose purpose, string code, DateTimeOffset now, TimeSpan lifetime) =>
        new()
        {
            Id = id,
            Phone = phone,
            Purpose = purpose,
            CodeHash = Hash(id, code),
            ExpiresAt = now + lifetime,
        };

    // Salted with the challenge id so equal codes on different challenges hash differently.
    private static string Hash(Guid id, string code) =>
        Convert.ToHexStringLower(SHA256.HashData(Encoding.UTF8.GetBytes($"{id:N}:{code}")));
}
