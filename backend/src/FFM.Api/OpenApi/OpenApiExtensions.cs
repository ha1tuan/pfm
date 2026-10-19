using System.Reflection;
using System.Text.Json.Nodes;
using Microsoft.AspNetCore.Mvc;
using Microsoft.OpenApi;

namespace FFM.Api.OpenApi;

internal static class OpenApiExtensions
{
    /// <summary>
    /// <c>dotnet build</c> runs this entry point through GetDocument.Insider to write the OpenAPI document
    /// that packages/api-client is generated from (Microsoft.Extensions.ApiDescription.Server).
    /// </summary>
    public static bool IsBuildTimeDocumentGeneration =>
        Assembly.GetEntryAssembly()?.GetName().Name == "GetDocument.Insider";

    /// <summary>
    /// The build has no secrets or connection strings, but options are validated at start. Placeholders satisfy
    /// validation only; document generation opens no connection and signs no token.
    /// </summary>
    public static WebApplicationBuilder AddBuildTimeDocumentPlaceholders(this WebApplicationBuilder builder)
    {
        if (IsBuildTimeDocumentGeneration)
        {
            builder.Configuration.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:Postgres"] = "Host=openapi-build",
                ["ConnectionStrings:RabbitMq"] = "amqp://openapi-build/",
                ["ConnectionStrings:Redis"] = "openapi-build",
                ["Jwt:SigningKey"] = "openapi-build",
            });
        }

        return builder;
    }

    /// <summary>OpenAPI document with the <c>code</c> and <c>traceId</c> every problem response carries (ErrorProblem).</summary>
    public static IServiceCollection AddFfmOpenApi(this IServiceCollection services) =>
        services.AddOpenApi(options => options.AddSchemaTransformer((schema, context, _) =>
        {
            if (typeof(ProblemDetails).IsAssignableFrom(context.JsonTypeInfo.Type))
            {
                schema.Properties ??= new Dictionary<string, IOpenApiSchema>();
                schema.Properties["code"] = new OpenApiSchema { Type = JsonSchemaType.String };
                schema.Properties["traceId"] = new OpenApiSchema { Type = JsonSchemaType.String };
                schema.Required ??= new HashSet<string>();
                schema.Required.Add("code");
            }

            return Task.CompletedTask;
        }));
}
