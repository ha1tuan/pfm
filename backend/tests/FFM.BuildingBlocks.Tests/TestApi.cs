using FFM.BuildingBlocks.Http;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Routing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace FFM.BuildingBlocks.Tests;

/// <summary>An in-memory host wired with the same error pipeline as FFM.Api, plus test-only endpoints.</summary>
internal static class TestApi
{
    public static async Task<HttpClient> StartAsync(
        Action<IEndpointRouteBuilder> map, Action<IServiceCollection>? services = null)
    {
        var builder = WebApplication.CreateSlimBuilder(new WebApplicationOptions { EnvironmentName = Environments.Development });
        builder.WebHost.UseTestServer();
        builder.Services.AddErrorHandling();
        services?.Invoke(builder.Services);

        var app = builder.Build();
        app.UseErrorHandling();
        map(app);
        await app.StartAsync();
        return app.GetTestClient();
    }
}
