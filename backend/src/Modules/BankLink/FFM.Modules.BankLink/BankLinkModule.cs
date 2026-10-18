using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace FFM.Modules.BankLink;

public static class BankLinkModule
{
    public static IServiceCollection AddBankLinkModule(this IServiceCollection services, IConfiguration configuration)
    {
        return services;
    }

    public static IEndpointRouteBuilder MapBankLinkEndpoints(this IEndpointRouteBuilder endpoints)
    {
        return endpoints;
    }
}
