namespace FFM.ArchitectureTests;

public class ContractsTests
{
    [Fact]
    public void Contracts_reference_only_BuildingBlocks()
    {
        foreach (var module in Solution.ModuleNames)
        {
            var offending = ArchRules.ForbiddenReferencesOfContracts(Solution.Contracts(module));

            Assert.True(offending.Count == 0, $"{module}.Contracts references {string.Join(", ", offending)}");
        }
    }

    [Fact]
    public void Rule_catches_an_assembly_referencing_a_module_project()
    {
        // This test assembly references FFM.Modules.Wallet (see Fixtures/ModuleInternals.cs).
        var offending = ArchRules.ForbiddenReferencesOfContracts(typeof(ContractsTests).Assembly);

        Assert.Contains("FFM.Modules.Wallet", offending);
    }
}
