using System.Diagnostics.CodeAnalysis;

namespace FFM.Domain.ValueObjects;

/// <summary>
/// A Vietnamese mobile number in E.164 (<c>+84XXXXXXXXX</c>). Users type <c>0XXXXXXXXX</c> or <c>+84XXXXXXXXX</c>;
/// both normalize to the same value, which is what lookups and storage use.
/// </summary>
public sealed record PhoneNumber
{
    private const string CountryPrefix = "+84";
    private const int NationalDigits = 9; // after the leading 0 / +84

    private static readonly char[] MobilePrefixes = ['3', '5', '7', '8', '9'];

    private PhoneNumber(string value)
    {
        Value = value;
    }

    public string Value { get; }

    public static bool TryParse(string? input, [NotNullWhen(true)] out PhoneNumber? phone)
    {
        phone = null;
        var national = input switch
        {
            null => null,
            _ when input.StartsWith(CountryPrefix, StringComparison.Ordinal) => input[CountryPrefix.Length..],
            _ when input.StartsWith('0') => input[1..],
            _ => null,
        };

        if (national is not { Length: NationalDigits }
            || !national.All(char.IsAsciiDigit)
            || !MobilePrefixes.Contains(national[0]))
        {
            return false;
        }

        phone = new PhoneNumber(CountryPrefix + national);
        return true;
    }

    /// <summary>For input already validated at the API boundary; throws on anything else.</summary>
    public static PhoneNumber Parse(string input) =>
        TryParse(input, out var phone)
            ? phone
            : throw new FormatException("Not a Vietnamese mobile number.");

    public override string ToString() => Value;
}
