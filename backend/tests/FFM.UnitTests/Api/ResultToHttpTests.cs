using FFM.BuildingBlocks.Results;
using Microsoft.AspNetCore.Http;

namespace FFM.BuildingBlocks.Tests;

public class ResultToHttpTests
{
    private sealed record Greeting(string Text);

    [Theory]
    [InlineData(ErrorKind.Validation, 400)]
    [InlineData(ErrorKind.Unauthorized, 401)]
    [InlineData(ErrorKind.Forbidden, 403)]
    [InlineData(ErrorKind.NotFound, 404)]
    [InlineData(ErrorKind.Conflict, 409)]
    [InlineData(ErrorKind.BusinessRule, 422)]
    [InlineData(ErrorKind.TooManyRequests, 429)]
    [InlineData(ErrorKind.Unavailable, 503)]
    public async Task Failure_becomes_problem_json_with_code_and_trace_id(ErrorKind kind, int expectedStatus)
    {
        Result<Greeting> result = new Error("overLimit", kind);

        var (status, contentType, body) = await HttpResultRunner.RunAsync(result.ToHttpResult());

        Assert.Equal(expectedStatus, status);
        Assert.Equal("application/problem+json", contentType);
        Assert.Equal(expectedStatus, body.GetProperty("status").GetInt32());
        Assert.Equal("overLimit", body.GetProperty("code").GetString());
        Assert.Equal("trace-123", body.GetProperty("traceId").GetString());
    }

    [Fact]
    public async Task Success_becomes_200_with_the_value()
    {
        Result<Greeting> result = new Greeting("xin chào");

        var (status, _, body) = await HttpResultRunner.RunAsync(result.ToHttpResult());

        Assert.Equal(200, status);
        Assert.Equal("xin chào", body.GetProperty("text").GetString());
    }

    [Fact]
    public async Task Success_uses_the_response_the_endpoint_picks()
    {
        Result<Greeting> result = new Greeting("xin chào");

        var (status, _, body) = await HttpResultRunner.RunAsync(
            result.ToHttpResult(g => TypedResults.Created("/greetings/1", g)));

        Assert.Equal(201, status);
        Assert.Equal("xin chào", body.GetProperty("text").GetString());
    }

    [Fact]
    public async Task Failure_ignores_the_success_response_and_becomes_problem_json()
    {
        Result<Greeting> result = new Error("feeChanged", ErrorKind.Conflict);

        var (status, _, body) = await HttpResultRunner.RunAsync(
            result.ToHttpResult(g => TypedResults.Created("/greetings/1", g)));

        Assert.Equal(409, status);
        Assert.Equal("feeChanged", body.GetProperty("code").GetString());
    }

    [Fact]
    public async Task Valueless_success_becomes_204()
    {
        var status = await HttpResultRunner.RunWithoutBodyAsync(Result.Success().ToHttpResult());

        Assert.Equal(204, status);
    }

    [Fact]
    public async Task Valueless_failure_becomes_problem_json()
    {
        Result result = new Error("alreadyLocked", ErrorKind.Conflict);

        var (status, _, body) = await HttpResultRunner.RunAsync(result.ToHttpResult());

        Assert.Equal(409, status);
        Assert.Equal("alreadyLocked", body.GetProperty("code").GetString());
    }
}
