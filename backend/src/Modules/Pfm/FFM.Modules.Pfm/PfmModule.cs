using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace FFM.Modules.Pfm;

public static class PfmModule
{
    public static IServiceCollection AddPfmModule(this IServiceCollection services, IConfiguration configuration)
    {
        return services;
    }

    public static IEndpointRouteBuilder MapPfmEndpoints(this IEndpointRouteBuilder endpoints)
    {
        return endpoints;
    }
}
