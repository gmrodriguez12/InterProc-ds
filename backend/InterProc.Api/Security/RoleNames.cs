namespace InterProc.Api.Security;

public static class RoleNames
{
    public const string Admin = "admin";
    public const string User = "usuario";

    public static readonly string[] All = [Admin, User];

    public static bool IsValid(string role) =>
        All.Contains(role, StringComparer.OrdinalIgnoreCase);

    public static string Normalize(string role) =>
        All.Single(candidate => candidate.Equals(role, StringComparison.OrdinalIgnoreCase));
}
