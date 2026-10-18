using FFM.Modules.Wallet;

namespace FFM.ArchitectureTests.Fixtures.ModuleInternals;

// Deliberate violation: a type outside Wallet calling into the Wallet module project.
internal static class UsesWalletInternals
{
    public static void Register() => WalletModule.AddWalletModule(null!, null!);
}
