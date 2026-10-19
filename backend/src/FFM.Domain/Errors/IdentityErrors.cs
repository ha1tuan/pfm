using FFM.Domain.Common;

namespace FFM.Domain.Errors;

/// <summary>Business failures of the Identity feature (backend/docs/api.md §3).</summary>
public static class IdentityErrors
{
    public static readonly Error PhoneAlreadyRegistered = new("phoneAlreadyRegistered", ErrorKind.Conflict);
}
