using System.Security.Cryptography;
using FFM.Api.Endpoints;
using FFM.Api.Errors;
using FFM.Domain.Common;
using FFM.Infrastructure.DependencyInjection;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.JsonWebTokens;
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
                    ValidAudiences = [AudienceGroups.MobileAudience, AudienceGroups.AdminAudience],
                    ValidAlgorithms = [SecurityAlgorithms.RsaSha256],
                    IssuerSigningKey = new RsaSecurityKey(rsa),
                    ClockSkew = jwt.Value.ClockSkew,
                };
                bearer.Events = new JwtBearerEvents
                {
                    OnChallenge = context =>
                    {
                        context.HandleResponse();
                        return WriteProblemAsync(context.HttpContext, ErrorCodes.InvalidToken, StatusCodes.Status401Unauthorized);
                    },
                    OnForbidden = context =>
                        WriteProblemAsync(context.HttpContext, ErrorCodes.Forbidden, StatusCodes.Status403Forbidden),
                };
            });

        services.AddAuthorizationBuilder()
            .AddPolicy(AudienceGroups.MobileUserPolicy, p => p.RequireAuthenticatedUser()
                .RequireClaim(JwtRegisteredClaimNames.Aud, AudienceGroups.MobileAudience))
            .AddPolicy(AudienceGroups.StaffPolicy, p => p.RequireAuthenticatedUser()
                .RequireClaim(JwtRegisteredClaimNames.Aud, AudienceGroups.AdminAudience));

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
