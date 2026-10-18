using System.Net;
using System.Text.Json;

namespace FFM.Api.IntegrationTests;

[Collection(PausesContainers.Name)]
public sealed class HealthTests(Infrastructure infrastructure) : IAsyncDisposable
{
    private readonly ApiFactory _factory = new(infrastructure);

    [Fact]
    public async Task Live_reports_healthy_while_the_process_is_up()
    {
        var response = await _factory.CreateClient().GetAsync("/health/live", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Ready_reports_healthy_with_every_dependency_up()
    {
        var response = await _factory.CreateClient().GetAsync("/health/ready", TestContext.Current.CancellationToken);
        var body = await ReadBodyAsync(response);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("Healthy", body.GetProperty("status").GetString());
        foreach (var dependency in Dependencies)
        {
            Assert.Equal("Healthy", body.GetProperty("entries").GetProperty(dependency).GetString());
        }
    }

    [Theory]
    [MemberData(nameof(Dependencies))]
    public async Task Ready_reports_unhealthy_when_a_dependency_is_down(string dependency)
    {
        var client = _factory.CreateClient();
        await infrastructure[dependency].PauseAsync(TestContext.Current.CancellationToken);
        try
        {
            var response = await client.GetAsync("/health/ready", TestContext.Current.CancellationToken);
            var body = await ReadBodyAsync(response);

            Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
            Assert.Equal("Unhealthy", body.GetProperty("entries").GetProperty(dependency).GetString());
            Assert.All(
                Dependencies.Select(d => d.Data).Where(d => d != dependency),
                other => Assert.Equal("Healthy", body.GetProperty("entries").GetProperty(other).GetString()));
        }
        finally
        {
            await infrastructure[dependency].UnpauseAsync(CancellationToken.None);
        }
    }

    public static TheoryData<string> Dependencies => ["postgres", "rabbitmq", "redis"];

    private static async Task<JsonElement> ReadBodyAsync(HttpResponseMessage response) =>
        JsonDocument.Parse(await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken)).RootElement;

    public ValueTask DisposeAsync() => _factory.DisposeAsync();
}
