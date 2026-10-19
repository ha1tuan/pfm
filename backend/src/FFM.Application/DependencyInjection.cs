using FluentValidation;
using Microsoft.Extensions.DependencyInjection;

namespace FFM.Application;

public static class DependencyInjection
{
    /// <summary>
    /// Use cases of the Application layer: business handlers (UseCases/), CRUD services (Services/)
    /// and request validators (Validators/).
    /// </summary>
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddValidatorsFromAssembly(typeof(DependencyInjection).Assembly, includeInternalTypes: true);
        return services;
    }
}
