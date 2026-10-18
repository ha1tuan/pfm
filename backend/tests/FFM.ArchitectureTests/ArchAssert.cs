using NetArchTest.Rules;
using TestResult = NetArchTest.Rules.TestResult;

namespace FFM.ArchitectureTests;

internal static class ArchAssert
{
    public static void Passes(TestResult result, string rule)
    {
        var offenders = result.FailingTypeNames ?? [];
        Assert.True(result.IsSuccessful, $"{rule}: {string.Join(", ", offenders)}");
    }
}
