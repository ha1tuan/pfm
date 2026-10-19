using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;

namespace FFM.BuildingBlocks.Tests;

internal static class HttpResultRunner
{
    public static async Task<(int Status, string? ContentType, JsonElement Body)> RunAsync(IResult result)
    {
        var context = await ExecuteAsync(result);

        context.Response.Body.Position = 0;
        var body = await JsonDocument.ParseAsync(context.Response.Body);
        return (context.Response.StatusCode, context.Response.ContentType, body.RootElement.Clone());
    }

    public static async Task<int> RunWithoutBodyAsync(IResult result)
    {
        var context = await ExecuteAsync(result);

        Assert.Equal(0, context.Response.Body.Length);
        return context.Response.StatusCode;
    }

    private static async Task<HttpContext> ExecuteAsync(IResult result)
    {
        var context = new DefaultHttpContext
        {
            RequestServices = new ServiceCollection().AddLogging().AddProblemDetails().BuildServiceProvider(),
            TraceIdentifier = "trace-123",
        };
        context.Response.Body = new MemoryStream();

        await result.ExecuteAsync(context);
        return context;
    }
}
