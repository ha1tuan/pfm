using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace FFM.BuildingBlocks.Http;

/// <summary>One route group per audience (backend/docs/api.md §1). Modules map their endpoints onto these.</summary>
public static class AudienceGroups
{
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
