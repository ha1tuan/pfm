
namespace FFM.Api.Middleware;

internal static class ErrorHandlingExtensions
{
    public static IServiceCollection AddErrorHandling(this IServiceCollection services)
    {
        services.AddProblemDetails();
        services.AddExceptionHandler<UnexpectedExceptionHandler>();
        return services;
    }

    public static IApplicationBuilder UseErrorHandling(this IApplicationBuilder app) =>
        app.UseExceptionHandler();
}
