namespace InterProc.Api.Domain;

public sealed class ProcedureType
{
    public Guid Id { get; set; }
    public required string Name { get; set; }
    public required string NormalizedName { get; set; }
    public required string Icon { get; set; }
    public bool IsArchived { get; set; }
    public DateTimeOffset? ArchivedAtUtc { get; set; }
    public string? ArchivedByUserId { get; set; }
    public Guid ConcurrencyToken { get; set; } = Guid.NewGuid();
    public ICollection<Procedure> Procedures { get; set; } = [];
}
