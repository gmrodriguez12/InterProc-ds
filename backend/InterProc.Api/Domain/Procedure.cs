namespace InterProc.Api.Domain;

public sealed class Procedure
{
    public Guid Id { get; set; }
    public Guid ProcedureTypeId { get; set; }
    public required ProcedureType ProcedureType { get; set; }
    public required string Title { get; set; }
    public required string NormalizedTitle { get; set; }
    public required string Icon { get; set; }
    public required string ShortDescription { get; set; }
    public int? EstimatedMinutes { get; set; }
    public int CurrentVersionNumber { get; set; }
    public bool IsArchived { get; set; }
    public DateTimeOffset? ArchivedAtUtc { get; set; }
    public string? ArchivedByUserId { get; set; }
    public Guid ConcurrencyToken { get; set; } = Guid.NewGuid();
    public ICollection<ProcedureVersion> Versions { get; set; } = [];
}
