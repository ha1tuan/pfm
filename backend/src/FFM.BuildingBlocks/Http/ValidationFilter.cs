using System.Text.Json;
using FFM.BuildingBlocks.Results;
using FluentValidation;
using Microsoft.AspNetCore.Http;

namespace FFM.BuildingBlocks.Http;

/// <summary>Runs <see cref="IValidator{T}"/> on the request body and returns <c>400 validationFailed</c> before the handler.</summary>
public sealed class ValidationFilter<TRequest>(IValidator<TRequest> validator) : IEndpointFilter
{
    public async ValueTask<object?> InvokeAsync(EndpointFilterInvocationContext context, EndpointFilterDelegate next)
    {
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
            "validationFailed",
            context.HttpContext);

        return TypedResults.Problem(problem);
    }
}
