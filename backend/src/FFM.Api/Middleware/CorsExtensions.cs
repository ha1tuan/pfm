namespace FFM.Api.Middleware;

internal static class CorsExtensions
{
    public const string SectionName = "Cors:AllowedOrigins";

    /// <summary>
    /// Browser origins allowed to call the API. Only Development lists one (Expo web); the admin console
    /// goes through the Vite proxy and native apps send no Origin, so production needs none.
    /// </summary>
    public static IServiceCollection AddDevCors(this IServiceCollection services, IConfiguration configuration)
    {
        var origins = configuration.GetSection(SectionName).Get<string[]>() ?? [];
        services.AddCors(cors => cors.AddDefaultPolicy(policy => policy
            .WithOrigins(origins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .WithExposedHeaders("Retry-After")));
        return services;
    }
}
