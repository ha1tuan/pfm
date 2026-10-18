using System.Net;
using System.Text.Json;

namespace FFM.Api.IntegrationTests;

public sealed class MeTests(Infrastructure infrastructure) : IAsyncDisposable
{
    private readonly ApiFactory _factory = new(infrastructure);

    [Fact]
    public async Task Me_without_a_token_returns_401_problem_with_code_and_trace_id()
    {
        var response = await _factory.CreateClient().GetAsync("/api/mobile/v1/me", TestContext.Current.CancellationToken);
        var body = JsonDocument.Parse(await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken)).RootElement;

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
        Assert.Equal(401, body.GetProperty("status").GetInt32());
        Assert.Equal("invalidToken", body.GetProperty("code").GetString());
        Assert.False(string.IsNullOrEmpty(body.GetProperty("traceId").GetString()));
    }

    public ValueTask DisposeAsync() => _factory.DisposeAsync();
}
