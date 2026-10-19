using FFM.Application.DTOs.Identity;
using FFM.Domain.ValueObjects;

namespace FFM.Application.Interfaces;

/// <summary>Read access to Users for other use cases and features (backend/docs/api.md §5, Identity).</summary>
public interface IUserDirectory
{
    Task<UserSummary?> FindByPhoneAsync(PhoneNumber phone, CancellationToken cancellationToken);
}
