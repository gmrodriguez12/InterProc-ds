using System.Text.RegularExpressions;

namespace InterProc.Api.Services;

public static partial class TextNormalizer
{
    public static string Normalize(string value) =>
        Whitespace().Replace(value.Trim(), " ").ToUpperInvariant();

    [GeneratedRegex(@"\s+")]
    private static partial Regex Whitespace();
}
