using InterProc.Api.Data;
using InterProc.Api.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InterProc.Api.Controllers;

[ApiController]
[Route("api/audit")]
[Authorize(Policy = AppPolicies.Admin)]
public sealed class AuditController(ApplicationDbContext dbContext) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult> List(CancellationToken cancellationToken)
    {
        var events = await dbContext.AuditEvents
            .AsNoTracking()
            .OrderByDescending(audit => audit.OccurredAtUtc)
            .Take(500)
            .Select(audit => new
            {
                audit.Id,
                audit.Action,
                audit.EntityType,
                audit.EntityId,
                audit.EntityLabel,
                audit.UserId,
                audit.UserDisplayName,
                audit.OccurredAtUtc
            })
            .ToListAsync(cancellationToken);
        return Ok(events);
    }
}
