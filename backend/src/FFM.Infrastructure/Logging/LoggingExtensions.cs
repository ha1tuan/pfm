using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Serilog;
using Serilog.Formatting.Compact;

namespace FFM.BuildingBlocks.Logging;

public static class LoggingExtensions
{
    /// <summary>Structured JSON to stdout. Never log amounts tied to an identity, tokens or OTPs.</summary>
    public static IHostApplicationBuilder AddStructuredLogging(this IHostApplicationBuilder builder)
    {
        builder.Services.AddSerilog((services, logger) => logger
            .ReadFrom.Configuration(builder.Configuration)
            .ReadFrom.Services(services)
            .Enrich.FromLogContext()
            .WriteTo.Console(new RenderedCompactJsonFormatter()));
        return builder;
    }
}
