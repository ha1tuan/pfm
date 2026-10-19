using FFM.Api.Errors;
using FFM.Api.Filters;
using FFM.Application.DTOs.Identity;
using FFM.Application.Interfaces;
using FFM.Application.UseCases.Identity.Commands;

namespace FFM.Api.Endpoints.Identity;

internal static class IdentityEndpoints
{
    public static void Map(IEndpointRouteBuilder endpoints)
    {
        var mobile = endpoints.MapMobileApi().WithTags("Identity");

        // Registration happens before the User has a token.
        mobile.MapPost("/auth/register/otp", async (
                RegistrationOtpRequest body,
                ICommandHandler<RequestRegistrationOtp, RegistrationOtpChallenge> handler,
                CancellationToken ct) =>
            (await handler.HandleAsync(body.ToCommand(), ct)).ToHttpResult())
            .WithValidation<RegistrationOtpRequest>()
            .Produces<RegistrationOtpChallenge>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status409Conflict)
            .ProducesProblem(StatusCodes.Status429TooManyRequests)
            .AllowAnonymous();

        // The profile body arrives with the Identity plan; for now only the audience guard is real.
        mobile.MapGet("/me", () => TypedResults.StatusCode(StatusCodes.Status501NotImplemented));
    }
}
