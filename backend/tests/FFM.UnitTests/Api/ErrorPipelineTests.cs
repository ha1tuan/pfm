using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Builder;

namespace FFM.UnitTests.Api;

public class ErrorPipelineTests
{
    [Fact]
    public async Task Unexpected_exception_becomes_500_internalError_without_details()
    {
        var client = await TestApi.StartAsync(app =>
            app.MapGet("/boom", string () => throw new InvalidOperationException("connection string leaked")));

        var response = await client.GetAsync("/boom", TestContext.Current.CancellationToken);
        var text = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
        var body = JsonDocument.Parse(text).RootElement;

        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
        Assert.Equal("internalError", body.GetProperty("code").GetString());
        Assert.False(string.IsNullOrEmpty(body.GetProperty("traceId").GetString()));
        Assert.DoesNotContain("leaked", text);
        Assert.DoesNotContain("InvalidOperationException", text);
    }
}
