using InterProc.Api.Domain;
using InterProc.Api.Services;
using Xunit;

namespace InterProc.Api.Tests;

public sealed class CatalogRulesTests
{
    [Fact]
    public void Normalize_collapses_whitespace_and_ignores_case()
    {
        Assert.Equal("SERVICIO TÉCNICO", TextNormalizer.Normalize("  Servicio   Técnico "));
    }

    [Fact]
    public void Type_with_active_procedure_cannot_be_archived()
    {
        var type = TypeWithProcedures(new Procedure { ProcedureType = null!, Title = "A", NormalizedTitle = "A", Icon = "x", ShortDescription = "", IsArchived = false });
        Assert.False(CatalogRules.CanArchive(type));
    }

    [Fact]
    public void Whitespace_only_mermaid_is_equivalent_to_null()
    {
        var current = Version(1, "First step", null);
        Assert.False(CatalogRules.VersionContentChanged(current, "First step", "   "));
    }

    [Theory]
    [InlineData(1, 1, false, false)]
    [InlineData(1, 2, true, false)]
    [InlineData(1, 2, false, true)]
    public void Version_delete_rule_protects_current_and_used_versions(int number, int current, bool used, bool expected)
    {
        var version = Version(number, "Steps", null);
        version.SourceWorkId = used ? Guid.NewGuid() : null;
        Assert.Equal(expected, CatalogRules.CanDelete(version, current));
    }

    private static ProcedureType TypeWithProcedures(params Procedure[] procedures) => new()
    {
        Name = "Type", NormalizedName = "TYPE", Icon = "x", Procedures = procedures
    };

    private static ProcedureVersion Version(int number, string steps, string? diagram) => new()
    {
        Procedure = null!, Number = number, Steps = steps, MermaidDiagram = diagram,
        Reason = "Test", CreatedByUserId = "user", CreatedByDisplayName = "User"
    };
}
