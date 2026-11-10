using InterProc.Api.Domain;

namespace InterProc.Api.Services;

public static class CatalogRules
{
    public static bool CanArchive(ProcedureType type) =>
        type.Procedures.All(procedure => procedure.IsArchived);

    public static bool VersionContentChanged(ProcedureVersion current, string steps, string? mermaidDiagram) =>
        current.Steps != steps.Trim() || current.MermaidDiagram != CleanOptional(mermaidDiagram);

    public static bool CanDelete(ProcedureVersion version, int currentVersionNumber) =>
        version.Number != currentVersionNumber && !version.SourceWorkId.HasValue;

    public static string? CleanOptional(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
