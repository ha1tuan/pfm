using System.Reflection;

namespace FFM.ArchitectureTests;

internal static class Solution
{
    public static readonly string[] ModuleNames =
        ["Identity", "Wallet", "Transfer", "BankLink", "Pricing", "Pfm", "Audit", "Admin"];

    public static Assembly Module(string name) => Assembly.Load($"FFM.Modules.{name}");

    public static Assembly Contracts(string name) => Assembly.Load($"FFM.Modules.{name}.Contracts");
}
