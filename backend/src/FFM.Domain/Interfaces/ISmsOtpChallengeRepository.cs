using FFM.Domain.Entities.Identity;

namespace FFM.Domain.Interfaces;

public interface ISmsOtpChallengeRepository
{
    void Add(SmsOtpChallenge challenge);
}
