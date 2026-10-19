using FFM.Api.Endpoints.Identity;

namespace FFM.Api.Endpoints;

internal static class EndpointExtensions
{
    /// <summary>Maps every feature's endpoints onto the audience groups in AudienceGroups.</summary>
    public static IEndpointRouteBuilder MapApiEndpoints(this IEndpointRouteBuilder endpoints)
    {
        IdentityEndpoints.Map(endpoints);
        return endpoints;
    }
}
