namespace FFM.Api.Endpoints.Identity;

internal static class IdentityEndpoints
{
    public static void Map(IEndpointRouteBuilder endpoints)
    {
        var mobile = endpoints.MapMobileApi().WithTags("Identity");

        // The profile body arrives with the Identity plan; for now only the audience guard is real.
        mobile.MapGet("/me", () => TypedResults.StatusCode(StatusCodes.Status501NotImplemented));
    }
}
