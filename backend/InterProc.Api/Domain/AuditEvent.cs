namespace InterProc.Api.Domain;

public sealed class AuditEvent
{
    public long Id { get; set; }
    public required string Action { get; set; }
    public required string EntityType { get; set; }
    public required string EntityId { get; set; }
    public required string EntityLabel { get; set; }
    public required string UserId { get; set; }
    public required string UserDisplayName { get; set; }
    public DateTimeOffset OccurredAtUtc { get; set; }
}
