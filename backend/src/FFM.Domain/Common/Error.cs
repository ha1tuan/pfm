namespace FFM.BuildingBlocks.Results;

/// <summary>A business failure. <see cref="Code"/> is the message key the apps display (backend/docs/api.md §3).</summary>
public sealed record Error(string Code, ErrorKind Kind, string? Detail = null);

public enum ErrorKind
{
    Validation,
    NotFound,
    Conflict,
    Forbidden,
    Unauthorized,
    BusinessRule,
}
