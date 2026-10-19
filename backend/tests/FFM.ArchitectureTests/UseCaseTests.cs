namespace FFM.ArchitectureTests;

public class UseCaseTests
{
    private const string FixtureRoot = "FFM.ArchitectureTests.Fixtures";

    [Fact]
    public void Handlers_live_under_UseCases_and_are_named_Handler()
    {
        var offending = ArchRules.MisplacedHandlers(Layers.Application, "FFM.Application.UseCases.");

        Assert.True(offending.Count == 0, $"Misplaced handlers: {string.Join(", ", offending)}");
    }

    [Fact]
    public void Services_live_under_Services()
    {
        ArchAssert.Passes(ArchRules.ServicesLiveUnderServices(Layers.Application, "FFM.Application.Services"), "Services");
    }

    [Fact]
    public void Rule_catches_a_handler_outside_UseCases()
    {
        var offending = ArchRules.MisplacedHandlers(typeof(UseCaseTests).Assembly, $"{FixtureRoot}.UseCases.");

        Assert.Equivalent(new[] { $"{FixtureRoot}.Misplaced.TopUpHandler", $"{FixtureRoot}.UseCases.Wallet.TopUp" }, offending);
    }

    [Fact]
    public void Rule_catches_a_service_outside_Services()
    {
        var result = ArchRules.ServicesLiveUnderServices(typeof(UseCaseTests).Assembly, $"{FixtureRoot}.Services");

        Assert.False(result.IsSuccessful);
    }
}
