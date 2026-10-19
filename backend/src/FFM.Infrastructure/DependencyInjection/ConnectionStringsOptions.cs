using System.ComponentModel.DataAnnotations;

namespace FFM.Infrastructure.DependencyInjection;

public sealed class ConnectionStringsOptions
{
    public const string SectionName = "ConnectionStrings";

    [Required]
    public string Postgres { get; init; } = string.Empty;

    [Required]
    public string RabbitMq { get; init; } = string.Empty;

    [Required]
    public string Redis { get; init; } = string.Empty;
}
