using System.Diagnostics;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace FFM.BuildingBlocks.Results;

/// <summary>The single mapping from <see cref="Error"/> to RFC 9457 problem details with <c>code</c> and <c>traceId</c>.</summary>
public static partial class ErrorProblem
{
    public static int StatusCodeOf(ErrorKind kind) => kind switch
    {
        ErrorKind.Validation => StatusCodes.Status400BadRequest,
        ErrorKind.Unauthorized => StatusCodes.Status401Unauthorized,
        ErrorKind.Forbidden => StatusCodes.Status403Forbidden,
        ErrorKind.NotFound => StatusCodes.Status404NotFound,
        ErrorKind.Conflict => StatusCodes.Status409Conflict,
        ErrorKind.BusinessRule => StatusCodes.Status422UnprocessableEntity,
        _ => throw new ArgumentOutOfRangeException(nameof(kind), kind, null),
    };

    public static ProblemDetails Create(string code, int status, HttpContext context, string? detail = null) =>
        Decorate(new ProblemDetails { Status = status, Detail = detail }, code, context);

    public static TProblem Decorate<TProblem>(TProblem problem, string code, HttpContext context)
        where TProblem : ProblemDetails
    {
        problem.Type ??= $"https://ffm.dev/errors/{KebabBoundary().Replace(code, "-$1").ToLowerInvariant()}";
        problem.Extensions["code"] = code;
        problem.Extensions["traceId"] = Activity.Current?.Id ?? context.TraceIdentifier;
        return problem;
    }

    public static IResult ToProblemResult(this Error error) => new ProblemResult(error);

    [GeneratedRegex("(?<!^)([A-Z])")]
    private static partial Regex KebabBoundary();

    private sealed class ProblemResult(Error error) : IResult
    {
        public Task ExecuteAsync(HttpContext httpContext) =>
            TypedResults.Problem(Create(error.Code, StatusCodeOf(error.Kind), httpContext, error.Detail))
                .ExecuteAsync(httpContext);
    }
}
