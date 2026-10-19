
namespace FFM.Api.Endpoints;

/// <summary>One route group per audience (backend/docs/api.md §1). Feature endpoints map onto these.</summary>
internal static class AudienceGroups
{
    /// <summary>JWT <c>aud</c> values. Identity issues exactly one per token; the API validates against both.</summary>
    public const string MobileAudience = "mobile";
    public const string AdminAudience = "admin";

    public const string MobileUserPolicy = "MobileUser";
    public const string StaffPolicy = "Staff";

    public static RouteGroupBuilder MapMobileApi(this IEndpointRouteBuilder endpoints) =>
        endpoints.MapGroup("/api/mobile/v1").RequireAuthorization(MobileUserPolicy);

    public static RouteGroupBuilder MapAdminApi(this IEndpointRouteBuilder endpoints) =>
        endpoints.MapGroup("/api/admin/v1").RequireAuthorization(StaffPolicy);

    // Provider callbacks carry an HMAC signature instead of a JWT.
    public static RouteGroupBuilder MapInternalApi(this IEndpointRouteBuilder endpoints) =>
        endpoints.MapGroup("/api/internal/v1").AllowAnonymous();
}
