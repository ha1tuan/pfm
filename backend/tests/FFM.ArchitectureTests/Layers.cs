using System.Reflection;

namespace FFM.ArchitectureTests;

internal static class Layers
{
    public static readonly Assembly Domain = Assembly.Load("FFM.Domain");
    public static readonly Assembly Application = Assembly.Load("FFM.Application");
    public static readonly Assembly Infrastructure = Assembly.Load("FFM.Infrastructure");
    public static readonly Assembly Api = Assembly.Load("FFM.Api");
    public static readonly Assembly Worker = Assembly.Load("FFM.Worker");
}
