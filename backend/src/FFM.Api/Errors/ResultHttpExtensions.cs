using Microsoft.AspNetCore.Http;

namespace FFM.BuildingBlocks.Results;

public static class ResultHttpExtensions
{
    public static IResult ToHttpResult<T>(this Result<T> result) =>
        result.IsSuccess ? TypedResults.Ok(result.Value) : result.Error.ToProblemResult();
}
