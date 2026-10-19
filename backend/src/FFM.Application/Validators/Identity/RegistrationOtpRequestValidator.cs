using FFM.Application.DTOs.Identity;
using FFM.Domain.ValueObjects;
using FluentValidation;

namespace FFM.Application.Validators.Identity;

internal sealed class RegistrationOtpRequestValidator : AbstractValidator<RegistrationOtpRequest>
{
    public RegistrationOtpRequestValidator()
    {
        RuleFor(r => r.Phone)
            .Must(phone => PhoneNumber.TryParse(phone, out _))
            .WithMessage("Must be a Vietnamese mobile number: 0XXXXXXXXX or +84XXXXXXXXX.");
    }
}
