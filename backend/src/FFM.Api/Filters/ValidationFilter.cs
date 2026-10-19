using System.Text.Json;
using FFM.Api.Errors;
using FFM.Domain.Common;
using FluentValidation;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;

namespace FFM.Api.Filters;

internal static class ValidationEndpointExtensions
{
    /// <summary>Validates the <typeparamref name="TRequest"/> argument with its registered <see cref="IValidator{T}"/>.</summary>
    public static RouteHandlerBuilder WithValidation<TRequest>(this RouteHandlerBuilder builder) =>
        builder.AddEndpointFilter<ValidationFilter<TRequest>>();
}

/// <summary>Runs <see cref="IValidator{T}"/> on the request body and returns <c>400 validationFailed</c> before the handler.</summary>
internal sealed class ValidationFilter<TRequest>(IValidator<TRequest> validator) : IEndpointFilter
{
    public async ValueTask<object?> InvokeAsync(EndpointFilterInvocationContext context, EndpointFilterDelegate next)
    {
        // Binding already rejects a missing body for a non-nullable parameter; nothing left to validate.
        var request = context.Arguments.OfType<TRequest>().FirstOrDefault();
        if (request is null)
        {
            return await next(context);
        }

        var validation = await validator.ValidateAsync(request, context.HttpContext.RequestAborted);
        if (validation.IsValid)
        {
            return await next(context);
        }

        var errors = validation.Errors
            .GroupBy(e => JsonNamingPolicy.CamelCase.ConvertName(e.PropertyName))
            .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());

        var problem = ErrorProblem.Decorate(
            new HttpValidationProblemDetails(errors) { Status = StatusCodes.Status400BadRequest },
            ErrorCodes.ValidationFailed,
            context.HttpContext);

        return TypedResults.Problem(problem);
    }
}
