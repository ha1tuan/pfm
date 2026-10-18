using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FFM.BuildingBlocks.Http;
using FluentValidation;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;

namespace FFM.BuildingBlocks.Tests;

public class ValidationFilterTests
{
    public sealed record NicknameRequest(string DisplayName);

    private sealed class NicknameRequestValidator : AbstractValidator<NicknameRequest>
    {
        public NicknameRequestValidator() => RuleFor(r => r.DisplayName).NotEmpty();
    }

    private static Task<HttpClient> StartAsync() => TestApi.StartAsync(
        app => app.MapPost("/nicknames", (NicknameRequest body) => TypedResults.Ok(body))
            .AddEndpointFilter<ValidationFilter<NicknameRequest>>(),
        services => services.AddScoped<IValidator<NicknameRequest>, NicknameRequestValidator>());

    [Fact]
    public async Task Invalid_request_returns_400_validationFailed_with_field_errors()
    {
        var client = await StartAsync();

        var response = await client.PostAsJsonAsync("/nicknames", new { displayName = "" }, TestContext.Current.CancellationToken);
        var body = JsonDocument.Parse(await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken)).RootElement;

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
        Assert.Equal("validationFailed", body.GetProperty("code").GetString());
        Assert.False(string.IsNullOrEmpty(body.GetProperty("traceId").GetString()));
        Assert.NotEmpty(body.GetProperty("errors").GetProperty("displayName").EnumerateArray());
    }

    [Fact]
    public async Task Valid_request_reaches_the_endpoint()
    {
        var client = await StartAsync();

        var response = await client.PostAsJsonAsync("/nicknames", new { displayName = "Tuấn" }, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}
