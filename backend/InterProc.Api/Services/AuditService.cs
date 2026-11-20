using InterProc.Api.Data;
using InterProc.Api.Domain;

namespace InterProc.Api.Services;

public sealed class AuditService(ApplicationDbContext dbContext)
{
    public void Record(
        string action,
        string entityType,
        string entityId,
        string entityLabel,
        ApplicationUser actor)
    {
        dbContext.AuditEvents.Add(new AuditEvent
        {
            Action = action,
            EntityType = entityType,
            EntityId = entityId,
            EntityLabel = entityLabel,
            UserId = actor.Id,
            UserDisplayName = actor.DisplayName,
            OccurredAtUtc = DateTimeOffset.UtcNow
        });
    }
}
