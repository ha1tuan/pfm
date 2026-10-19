using System.Globalization;
using System.Security.Cryptography;
using FFM.Application.DTOs.Identity;
using FFM.Application.Interfaces;
using FFM.Domain.Common;
using FFM.Domain.Entities.Identity;
using FFM.Domain.Errors;
using FFM.Domain.Interfaces;
using FFM.Domain.ValueObjects;

namespace FFM.Application.UseCases.Identity.Commands;

/// <summary>UC-01 step 1: send a registration SMS OTP to a phone that has no User yet.</summary>
public sealed record RequestRegistrationOtp(PhoneNumber Phone);

internal sealed class RequestRegistrationOtpHandler(
    IUserDirectory users,
    ISmsOtpChallengeRepository challenges,
    IUnitOfWork unitOfWork,
    ISmsSender sms,
    IIdGenerator ids,
    TimeProvider clock,
    SmsOtpOptions options) : ICommandHandler<RequestRegistrationOtp, RegistrationOtpChallenge>
{
    public async Task<Result<RegistrationOtpChallenge>> HandleAsync(
        RequestRegistrationOtp command, CancellationToken cancellationToken)
    {
        if (await users.FindByPhoneAsync(command.Phone, cancellationToken) is not null)
        {
            return IdentityErrors.PhoneAlreadyRegistered;
        }

        var code = NewCode(options.Length);
        var challenge = SmsOtpChallenge.Issue(
            ids.NewId(), command.Phone, SmsOtpPurpose.Register, code, clock.GetUtcNow(), options.Lifetime);

        challenges.Add(challenge);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        // Sent after the save: an SMS for a challenge that was never stored would be a code nobody can redeem.
        await sms.SendAsync(
            new SmsMessage(command.Phone.Value, $"FFM: ma xac thuc dang ky la {code}. Het han sau {options.Lifetime.TotalMinutes:0} phut. Khong chia se ma nay."),
            cancellationToken);

        return new RegistrationOtpChallenge(challenge.Id, challenge.ExpiresAt);
    }

    private static string NewCode(int length) =>
        RandomNumberGenerator.GetInt32(0, (int)Math.Pow(10, length))
            .ToString(CultureInfo.InvariantCulture)
            .PadLeft(length, '0');
}
