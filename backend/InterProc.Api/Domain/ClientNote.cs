namespace InterProc.Api.Domain;

public sealed class ClientNote
{
    public Guid Id { get; set; }
    public Guid ClientId { get; set; }
    public required Client Client { get; set; }
    public Guid? WorkItemId { get; set; }
    public WorkItem? WorkItem { get; set; }
    public required string Text { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
    public required string CreatedByUserId { get; set; }
    public required string CreatedByDisplayName { get; set; }
    public DateTimeOffset? UpdatedAtUtc { get; set; }
    public string? UpdatedByUserId { get; set; }
    public string? UpdatedByDisplayName { get; set; }
    public Guid ConcurrencyToken { get; set; } = Guid.NewGuid();
}
