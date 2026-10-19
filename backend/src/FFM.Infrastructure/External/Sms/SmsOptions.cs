using System.ComponentModel.DataAnnotations;

namespace FFM.Infrastructure.External.Sms;

public sealed class SmsOptions
{
    public const string SectionName = "Sms";

    /// <summary>Key of the <c>ISmsSender</c> keyed service. Only <c>mock</c> exists.</summary>
    [Required]
    public string Mode { get; init; } = MockSmsSender.Mode;
}
