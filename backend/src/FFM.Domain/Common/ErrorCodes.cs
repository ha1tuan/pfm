namespace FFM.Domain.Common;

/// <summary>
/// Codes raised by the shared pipeline rather than by one feature (backend/docs/api.md §3).
/// Feature-specific codes live in that feature's errors class, e.g. Domain/Errors/TransferErrors.cs.
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
