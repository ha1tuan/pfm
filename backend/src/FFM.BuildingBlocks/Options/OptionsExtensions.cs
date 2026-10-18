using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace FFM.BuildingBlocks.Options;

public static class OptionsExtensions
{
    /// <summary>Binds <typeparamref name="TOptions"/> to a configuration section and fails the host at start if it is invalid.</summary>
    public static OptionsBuilder<TOptions> AddValidatedOptions<TOptions>(this IServiceCollection services, string sectionName)
        where TOptions : class =>
        services.AddOptions<TOptions>()
            .BindConfiguration(sectionName)
            .ValidateDataAnnotations()
            .ValidateOnStart();
}
