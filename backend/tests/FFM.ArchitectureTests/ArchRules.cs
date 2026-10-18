using System.Reflection;
using NetArchTest.Rules;
using TestResult = NetArchTest.Rules.TestResult;

namespace FFM.ArchitectureTests;

internal static class ArchRules
{
    // A module may reach another module only through its .Contracts project.
    public static TestResult DoNotUseInternalsOf(PredicateList subject, Assembly otherModule)
    {
        var rootNamespace = otherModule.GetName().Name!;
        var internalTypes = otherModule.GetTypes()
            .Where(t => t.Namespace is not null && t.Namespace.StartsWith(rootNamespace, StringComparison.Ordinal))
            .Select(t => t.FullName!)
            .ToArray();

        return subject.ShouldNot().HaveDependencyOnAny(internalTypes).GetResult();
    }

    public static TestResult DomainIsIsolated(Assembly module, string rootNamespace) =>
        Types.InAssembly(module)
            .That().ResideInNamespace($"{rootNamespace}.Domain")
            .ShouldNot().HaveDependencyOnAny(
                "Microsoft.EntityFrameworkCore",
                $"{rootNamespace}.Application",
                $"{rootNamespace}.Infrastructure")
            .GetResult();

    // Hosts may touch a module project only through its XxxModule class.
    public static TestResult UseOnlyModuleClasses(PredicateList host, IEnumerable<Type> moduleTypes)
    {
        var forbidden = moduleTypes
            .Where(t => t.Namespace?.StartsWith("FFM.", StringComparison.Ordinal) == true)
            .Where(t => !IsModuleClass(t))
            .Select(t => t.FullName!)
            .ToArray();

        return host.ShouldNot().HaveDependencyOnAny(forbidden).GetResult();
    }

    // A module project exports only XxxModule, whose public methods are AddXxxModule and MapXxxEndpoints.
    public static IReadOnlyList<string> PublicSurfaceViolations(IEnumerable<Type> exportedTypes, string moduleName)
    {
        string[] entryPoints = [$"Add{moduleName}Module", $"Map{moduleName}Endpoints"];
        var violations = new List<string>();

        foreach (var type in exportedTypes)
        {
            if (type.Name != $"{moduleName}Module")
            {
                violations.Add(type.Name);
                continue;
            }

            violations.AddRange(type
                .GetMethods(BindingFlags.Public | BindingFlags.Static | BindingFlags.Instance | BindingFlags.DeclaredOnly)
                .Where(m => !entryPoints.Contains(m.Name))
                .Select(m => $"{type.Name}.{m.Name}"));
        }

        return violations;
    }

    private static bool IsModuleClass(Type type) =>
        type.IsClass && type.IsAbstract && type.IsSealed && type.Name.EndsWith("Module", StringComparison.Ordinal);

    // .Contracts may reference FFM.BuildingBlocks and nothing else of ours, and no EF Core.
    public static IReadOnlyList<string> ForbiddenReferencesOfContracts(Assembly contracts) =>
        contracts.GetReferencedAssemblies()
            .Select(a => a.Name!)
            .Where(name => (name.StartsWith("FFM.", StringComparison.Ordinal) && name != "FFM.BuildingBlocks")
                           || name.StartsWith("Microsoft.EntityFrameworkCore", StringComparison.Ordinal))
            .ToList();
}
