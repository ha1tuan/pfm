namespace FFM.ArchitectureTests.Fixtures.FakeModule
{
    public static class FakeModule
    {
        public static void AddFakeModule() { }

        public static void MapFakeEndpoints() { }

        // Deliberate violation: a third public entry point.
        public static void SeedFake() { }
    }

    // Deliberate violation: a public type other than the module class.
    public sealed class FakeHandler
    {
        public void Handle() { }
    }
}

namespace FFM.ArchitectureTests.Fixtures.FakeHost
{
    // Deliberate violation: a host using a module type beyond its entry points.
    internal static class FakeProgram
    {
        public static void Run() => new FakeModule.FakeHandler().Handle();
    }
}
