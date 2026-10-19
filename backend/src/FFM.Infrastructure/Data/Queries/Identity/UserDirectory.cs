using FFM.Application.DTOs.Identity;
using FFM.Application.Interfaces;
using FFM.Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;

namespace FFM.Infrastructure.Data.Queries.Identity;

internal sealed class UserDirectory(FfmDbContext db) : IUserDirectory
{
    public Task<UserSummary?> FindByPhoneAsync(PhoneNumber phone, CancellationToken cancellationToken) =>
        db.Users.AsNoTracking()
            .Where(u => u.PhoneNumber == phone.Value)
            .Select(u => new UserSummary(u.Id, u.FullName, u.PhoneNumber!, u.KycLevel, u.Status))
            .SingleOrDefaultAsync(cancellationToken);
}
