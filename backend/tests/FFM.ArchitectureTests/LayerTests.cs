namespace FFM.ArchitectureTests;

public class LayerTests
{
    [Fact]
    public void Domain_does_not_depend_on_EF_Core_Application_or_Infrastructure()
    {
        foreach (var module in Solution.ModuleNames)
        {
            var result = ArchRules.DomainIsIsolated(Solution.Module(module), $"FFM.Modules.{module}");

            ArchAssert.Passes(result, $"{module}.Domain");
        }
    }

    [Fact]
    public void Rule_catches_Domain_depending_on_Infrastructure()
    {
        var result = ArchRules.DomainIsIsolated(
            typeof(LayerTests).Assembly, "FFM.ArchitectureTests.Fixtures.Layers");

        Assert.False(result.IsSuccessful);
    }
}
