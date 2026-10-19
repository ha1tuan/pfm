using FFM.Domain.Common;

namespace FFM.Api.Errors;

internal static class ResultHttpExtensions
{
    /// <summary>Success becomes <c>200</c> with the value; failure becomes problem details.</summary>
    public static IResult ToHttpResult<T>(this Result<T> result) =>
        result.ToHttpResult(value => TypedResults.Ok(value));

    /// <summary>
    /// The endpoint picks the success response (<c>201 Created</c>, <c>202 Accepted</c> …);
    /// failure still maps through <see cref="ErrorProblem"/>.
    /// </summary>
    public static IResult ToHttpResult<T>(this Result<T> result, Func<T, IResult> onSuccess) =>
        result.IsSuccess ? onSuccess(result.Value) : result.Error.ToProblemResult();

    /// <summary>Success becomes <c>204 No Content</c>; failure becomes problem details.</summary>
    public static IResult ToHttpResult(this Result result) =>
        result.IsSuccess ? TypedResults.NoContent() : result.Error.ToProblemResult();
}
