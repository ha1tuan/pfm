using FFM.BuildingBlocks.Results;

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
}
