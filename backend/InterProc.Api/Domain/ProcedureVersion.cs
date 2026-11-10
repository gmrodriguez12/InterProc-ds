namespace InterProc.Api.Domain;

public sealed class ProcedureVersion
{
    public Guid Id { get; set; }
    public Guid ProcedureId { get; set; }
    public required Procedure Procedure { get; set; }
    public int Number { get; set; }
    public required string Steps { get; set; }
    public string? MermaidDiagram { get; set; }
    public required string Reason { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
    public required string CreatedByUserId { get; set; }
    public required string CreatedByDisplayName { get; set; }
    public Guid? SourceWorkId { get; set; }
}
