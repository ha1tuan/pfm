using FFM.Domain.Entities.Identity;
using Microsoft.AspNetCore.Identity;

namespace FFM.Infrastructure.Data.Identity;

/// <summary>
/// The User as ASP.NET Core Identity stores it (<c>identity.users</c>). Lives here, not in Domain, so Domain
/// stays free of Identity types. <see cref="IdentityUser{TKey}.PhoneNumber"/> holds the E.164 login phone.
/// </summary>
public sealed class UserIdentity : IdentityUser<Guid>
{
    public string FullName { get; set; } = string.Empty;

    public short KycLevel { get; set; } = 1;

    public UserStatus Status { get; set; } = UserStatus.Active;

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset? LastLoginAt { get; set; }
}
