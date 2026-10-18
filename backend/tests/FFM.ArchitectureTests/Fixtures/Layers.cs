namespace FFM.ArchitectureTests.Fixtures.Layers.Infrastructure
{
    internal sealed class SomeRepository;
}

namespace FFM.ArchitectureTests.Fixtures.Layers.Domain
{
    // Deliberate violation: Domain depending on Infrastructure.
    internal sealed class LeakyEntity
    {
        public Infrastructure.SomeRepository? Repository { get; set; }
    }
}
