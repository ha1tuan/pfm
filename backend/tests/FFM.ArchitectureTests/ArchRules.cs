using System.Reflection;
using FFM.Application.Interfaces;
using NetArchTest.Rules;
using TestResult = NetArchTest.Rules.TestResult;

namespace FFM.ArchitectureTests;

internal static class ArchRules
{
    // Domain is the innermost layer: the base class library and nothing else.
    public static IReadOnlyList<string> NonBclReferences(Assembly assembly) =>
        assembly.GetReferencedAssemblies()
            .Select(a => a.Name!)
            .Where(name => !name.StartsWith("System", StringComparison.Ordinal)
                           && name is not ("netstandard" or "mscorlib"))
            .ToList();

    // Dependencies point inward: an assembly may not reference anything matching a forbidden prefix.
    public static IReadOnlyList<string> ForbiddenReferences(Assembly assembly, IEnumerable<string> forbiddenPrefixes) =>
        assembly.GetReferencedAssemblies()
            .Select(a => a.Name!)
            .Where(name => forbiddenPrefixes.Any(p => name.StartsWith(p, StringComparison.Ordinal)))
            .ToList();

    // Business use cases are handlers named *Handler under <root>.UseCases.
    public static IReadOnlyList<string> MisplacedHandlers(Assembly assembly, string useCasesNamespace) =>
        assembly.GetTypes()
            .Where(IsHandler)
            .Where(t => !(t.Namespace ?? string.Empty).StartsWith(useCasesNamespace, StringComparison.Ordinal)
                        || !t.Name.EndsWith("Handler", StringComparison.Ordinal))
            .Select(t => t.FullName!)
            .ToList();

    // CRUD services are classes named *Service under <root>.Services, and are never handlers.
    public static TestResult ServicesLiveUnderServices(Assembly assembly, string servicesNamespace) =>
        Types.InAssembly(assembly)
            .That().AreClasses().And().HaveNameEndingWith("Service")
            .Should().ResideInNamespace(servicesNamespace)
            .GetResult();

    public static bool IsHandler(Type type) =>
        type is { IsClass: true, IsAbstract: false }
        && type.GetInterfaces().Any(i => i.IsGenericType
            && (i.GetGenericTypeDefinition() == typeof(ICommandHandler<,>)
                || i.GetGenericTypeDefinition() == typeof(IQueryHandler<,>)));
}
