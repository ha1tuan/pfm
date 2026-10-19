using FFM.Domain.Entities.Identity;
using FFM.Domain.Interfaces;

namespace FFM.Infrastructure.Data.Repositories.Identity;

internal sealed class SmsOtpChallengeRepository(FfmDbContext db) : ISmsOtpChallengeRepository
{
    public void Add(SmsOtpChallenge challenge) => db.SmsOtpChallenges.Add(challenge);
}
