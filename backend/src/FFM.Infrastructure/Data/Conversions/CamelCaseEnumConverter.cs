using System.Text.Json;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace FFM.Infrastructure.Data.Conversions;

/// <summary>Stores an enum as camelCase text (<c>deviceBinding</c>), matching the API enums (backend/docs/erd.md).</summary>
internal sealed class CamelCaseEnumConverter<TEnum>() : ValueConverter<TEnum, string>(
    value => JsonNamingPolicy.CamelCase.ConvertName(value.ToString()),
    text => Enum.Parse<TEnum>(text, true))
    where TEnum : struct, Enum
{
    /// <summary>SQL list for a <c>CHECK (column IN (…))</c> constraint.</summary>
    public static string SqlValues() =>
        string.Join(", ", Enum.GetNames<TEnum>().Select(n => $"'{JsonNamingPolicy.CamelCase.ConvertName(n)}'"));
}
