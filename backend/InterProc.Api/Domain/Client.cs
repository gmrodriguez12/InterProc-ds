namespace InterProc.Api.Domain;

public sealed class Client
{
    public Guid Id { get; set; }
    public required string Name { get; set; }
    public required string NormalizedName { get; set; }
    public string? TaxId { get; set; }
    public string? ContactPerson { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public bool IsArchived { get; set; }
    public DateTimeOffset? ArchivedAtUtc { get; set; }
    public string? ArchivedByUserId { get; set; }
    public Guid ConcurrencyToken { get; set; } = Guid.NewGuid();
    public ICollection<ClientNote> Notes { get; set; } = [];
    public ICollection<WorkItem> Works { get; set; } = [];
}
