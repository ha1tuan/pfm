using FFM.ArchitectureTests.Fixtures.FakeModule;
using NetArchTest.Rules;

namespace FFM.ArchitectureTests;

public class HostTests
{
    public static TheoryData<string> Hosts => ["FFM.Api", "FFM.Worker"];

    [Theory]
    [MemberData(nameof(Hosts))]
    public void Host_uses_modules_only_through_their_module_class(string host)
    {
        var result = ArchRules.UseOnlyModuleClasses(
            Types.InAssembly(System.Reflection.Assembly.Load(host)).That().HaveNameMatching(".*"),
            Solution.ModuleNames.SelectMany(m => Solution.Module(m).GetTypes()));

        ArchAssert.Passes(result, host);
    }

    [Fact]
    public void Module_projects_expose_only_their_add_and_map_entry_points()
    {
        foreach (var module in Solution.ModuleNames)
        {
            var offending = ArchRules.PublicSurfaceViolations(Solution.Module(module).GetExportedTypes(), module);

            Assert.True(offending.Count == 0, $"{module}: {string.Join(", ", offending)}");
        }
    }

    [Fact]
    public void Rule_catches_a_host_using_a_module_type_other_than_its_module_class()
    {
        var result = ArchRules.UseOnlyModuleClasses(
            Types.InAssembly(typeof(HostTests).Assembly).That().ResideInNamespace("FFM.ArchitectureTests.Fixtures.FakeHost"),
            typeof(FakeModule).Assembly.GetTypes().Where(t => t.Namespace == typeof(FakeModule).Namespace));

        Assert.False(result.IsSuccessful);
    }

    [Fact]
    public void Rule_catches_extra_public_types_and_entry_points()
    {
        var offending = ArchRules.PublicSurfaceViolations([typeof(FakeModule), typeof(FakeHandler)], "Fake");

        Assert.Equivalent(new[] { "FakeModule.SeedFake", "FakeHandler" }, offending);
    }
}
