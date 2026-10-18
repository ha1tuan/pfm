using NetArchTest.Rules;

namespace FFM.ArchitectureTests;

public class ModuleBoundaryTests
{
    [Fact]
    public void Modules_do_not_use_other_modules_internals()
    {
        foreach (var module in Solution.ModuleNames)
        foreach (var other in Solution.ModuleNames.Where(o => o != module))
        {
            var result = ArchRules.DoNotUseInternalsOf(
                Types.InAssembly(Solution.Module(module)).That().ResideInNamespace($"FFM.Modules.{module}"),
                Solution.Module(other));

            ArchAssert.Passes(result, $"{module} -> {other} internals");
        }
    }

    [Fact]
    public void Rule_catches_a_type_using_another_modules_internals()
    {
        var result = ArchRules.DoNotUseInternalsOf(
            Types.InAssembly(typeof(ModuleBoundaryTests).Assembly)
                .That().ResideInNamespace("FFM.ArchitectureTests.Fixtures.ModuleInternals"),
            Solution.Module("Wallet"));

        Assert.False(result.IsSuccessful);
    }
}
