using System.Security.Cryptography;
using FFM.BuildingBlocks.Http;
using FFM.BuildingBlocks.Options;
using FFM.BuildingBlocks.Results;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace FFM.Api.Auth;

internal static class AuthenticationExtensions
{
    public static IServiceCollection AddJwtAuthentication(this IServiceCollection services)
    {
        services.AddValidatedOptions<JwtOptions>(JwtOptions.SectionName);

        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer();
        services.AddOptions<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme)
            .Configure<IOptions<JwtOptions>>((bearer, jwt) =>
            {
                var rsa = RSA.Create();
                rsa.ImportFromPem(jwt.Value.SigningKey);

                bearer.MapInboundClaims = false;
                bearer.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidIssuer = jwt.Value.Issuer,
                    ValidAudiences = ["mobile", "admin"],
                    IssuerSigningKey = new RsaSecurityKey(rsa),
                };
                bearer.Events = new JwtBearerEvents
                {
                    OnChallenge = context =>
                    {
                        context.HandleResponse();
                        return WriteProblemAsync(context.HttpContext, "invalidToken", StatusCodes.Status401Unauthorized);
                    },
                    OnForbidden = context =>
                        WriteProblemAsync(context.HttpContext, "forbidden", StatusCodes.Status403Forbidden),
                };
            });

        services.AddAuthorizationBuilder()
            .AddPolicy(AudienceGroups.MobileUserPolicy, p => p.RequireAuthenticatedUser().RequireClaim("aud", "mobile"))
            .AddPolicy(AudienceGroups.StaffPolicy, p => p.RequireAuthenticatedUser().RequireClaim("aud", "admin"));

        return services;
    }

    private static Task WriteProblemAsync(HttpContext httpContext, string code, int status)
    {
        httpContext.Response.StatusCode = status;
        return httpContext.RequestServices.GetRequiredService<IProblemDetailsService>().WriteAsync(new ProblemDetailsContext
        {
            HttpContext = httpContext,
            ProblemDetails = ErrorProblem.Create(code, status, httpContext),
        }).AsTask();
    }
}
