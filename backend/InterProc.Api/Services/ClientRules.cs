using InterProc.Api.Domain;

namespace InterProc.Api.Services;

public static class ClientRules
{
    public static bool HasOpenWorks(Client client) =>
        client.Works.Any(work => !work.IsArchived && !WorkStates.IsClosed(work.State));

    public static string? CleanOptional(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
