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

    /// <summary>Tolerated clock drift when checking <c>exp</c>/<c>nbf</c>; small because access tokens live 10 minutes.</summary>
    [Range(typeof(TimeSpan), "00:00:00", "00:05:00")]
    public TimeSpan ClockSkew { get; init; } = TimeSpan.FromSeconds(30);
}
