namespace FFM.BuildingBlocks.Results;

/// <summary>
/// Codes raised by the shared pipeline rather than by one module (backend/docs/api.md §3).
/// Module-specific codes live with their module's errors.
/// </summary>
public static class ErrorCodes
{
    public const string ValidationFailed = "validationFailed";
    public const string InvalidToken = "invalidToken";
    public const string Forbidden = "forbidden";
    public const string NotFound = "notFound";
    public const string TooManyAttempts = "tooManyAttempts";
    public const string InternalError = "internalError";
}
