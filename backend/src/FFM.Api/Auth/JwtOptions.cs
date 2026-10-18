using System.ComponentModel.DataAnnotations;

namespace FFM.Api.Auth;

public sealed class JwtOptions
{
    public const string SectionName = "Jwt";

    [Required]
    public string Issuer { get; init; } = string.Empty;

    /// <summary>RSA private key (PEM). Secret: supplied only through the environment (<c>Jwt__SigningKey</c>).</summary>
    [Required]
    public string SigningKey { get; init; } = string.Empty;
}
