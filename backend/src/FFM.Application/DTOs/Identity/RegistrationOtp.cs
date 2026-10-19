using FFM.Application.UseCases.Identity.Commands;
using FFM.Domain.ValueObjects;

namespace FFM.Application.DTOs.Identity;

/// <summary>Body of <c>POST /auth/register/otp</c>. <see cref="Phone"/> is <c>0XXXXXXXXX</c> or <c>+84XXXXXXXXX</c>.</summary>
public sealed record RegistrationOtpRequest(string Phone)
{
    /// <remarks>Call only after the request passed its validator.</remarks>
    public RequestRegistrationOtp ToCommand() => new(PhoneNumber.Parse(Phone));
}

public sealed record RegistrationOtpChallenge(Guid ChallengeId, DateTimeOffset ExpiresAt);
