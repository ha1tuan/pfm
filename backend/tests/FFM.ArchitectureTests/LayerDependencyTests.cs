using FFM.ArchitectureTests.Fixtures;

namespace FFM.ArchitectureTests;

public class LayerDependencyTests
{
    private static readonly string[] OuterLayers = ["FFM.Infrastructure", "FFM.Api", "FFM.Worker"];

    // Application talks to the outside world only through its own interfaces.
    private static readonly string[] InfrastructureLibraries =
        ["Microsoft.AspNetCore", "Microsoft.EntityFrameworkCore", "Npgsql", "Dapper", "RabbitMQ", "StackExchange.Redis", "Serilog"];

    [Fact]
    public void Domain_references_only_the_base_class_library()
    {
        var offending = ArchRules.NonBclReferences(Layers.Domain);

        Assert.True(offending.Count == 0, $"FFM.Domain references {string.Join(", ", offending)}");
    }

    [Fact]
    public void Application_references_neither_outer_layers_nor_infrastructure_libraries()
    {
        var offending = ArchRules.ForbiddenReferences(Layers.Application, [.. OuterLayers, .. InfrastructureLibraries]);

        Assert.True(offending.Count == 0, $"FFM.Application references {string.Join(", ", offending)}");
    }

    [Fact]
    public void Infrastructure_does_not_reference_the_hosts()
    {
        var offending = ArchRules.ForbiddenReferences(Layers.Infrastructure, ["FFM.Api", "FFM.Worker"]);

        Assert.True(offending.Count == 0, $"FFM.Infrastructure references {string.Join(", ", offending)}");
    }

    [Fact]
    public void Worker_does_not_reference_the_Api()
    {
        var offending = ArchRules.ForbiddenReferences(Layers.Worker, ["FFM.Api"]);

        Assert.True(offending.Count == 0, $"FFM.Worker references {string.Join(", ", offending)}");
    }

    [Fact]
    public void Rule_catches_a_non_bcl_reference()
    {
        // This test assembly references xunit and NetArchTest.
        Assert.NotEmpty(ArchRules.NonBclReferences(typeof(LayerDependencyTests).Assembly));
    }

    [Fact]
    public void Rule_catches_a_reference_to_an_outer_layer()
    {
        // Fixtures/UsesApi.cs makes this assembly reference FFM.Api.
        _ = UsesApi.EntryPoint;

        Assert.Contains("FFM.Api", ArchRules.ForbiddenReferences(typeof(LayerDependencyTests).Assembly, OuterLayers));
    }
}
