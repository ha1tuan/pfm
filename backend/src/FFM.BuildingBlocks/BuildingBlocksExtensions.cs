using FFM.BuildingBlocks.Application;
using FFM.BuildingBlocks.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace FFM.BuildingBlocks;

public static class BuildingBlocksExtensions
{
    /// <summary>Services every host needs before modules are added: clock, id generator, infrastructure connections.</summary>
    public static IServiceCollection AddBuildingBlocks(this IServiceCollection services)
    {
        services.TryAddSingleton(TimeProvider.System);
        services.TryAddSingleton<IIdGenerator, UuidV7Generator>();
        services.AddInfrastructure();
        return services;
    }
}
