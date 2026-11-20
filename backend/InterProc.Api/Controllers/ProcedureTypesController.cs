using System.ComponentModel.DataAnnotations;
using InterProc.Api.Data;
using InterProc.Api.Domain;
using InterProc.Api.Security;
using InterProc.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InterProc.Api.Controllers;

[ApiController]
[Route("api/procedure-types")]
[Authorize(Policy = AppPolicies.ActiveUser)]
public sealed class ProcedureTypesController(
    ApplicationDbContext dbContext,
    UserManager<ApplicationUser> userManager,
    AuditService auditService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ProcedureTypeResponse>>> List(
        [FromQuery] bool archived = false,
        CancellationToken cancellationToken = default)
    {
        var items = await dbContext.ProcedureTypes.AsNoTracking()
            .Where(type => type.IsArchived == archived)
            .OrderBy(type => type.Name)
            .Select(type => new ProcedureTypeResponse(type.Id, type.Name, type.Icon, type.IsArchived,
                type.Procedures.Count(procedure => !procedure.IsArchived), type.ConcurrencyToken))
            .ToListAsync(cancellationToken);
        return Ok(items);
    }

    [HttpPost]
    public async Task<ActionResult<ProcedureTypeResponse>> Create(ProcedureTypeRequest request, CancellationToken cancellationToken)
    {
        var normalizedName = TextNormalizer.Normalize(request.Name);
        if (await dbContext.ProcedureTypes.AnyAsync(type => !type.IsArchived && type.NormalizedName == normalizedName, cancellationToken))
        {
            return NameConflict();
        }

        var type = new ProcedureType
        {
            Name = request.Name.Trim(), NormalizedName = normalizedName, Icon = request.Icon.Trim(), IsArchived = false
        };
        dbContext.ProcedureTypes.Add(type);
        await dbContext.SaveChangesAsync(cancellationToken);
        return CreatedAtAction(nameof(List), ToResponse(type, 0));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ProcedureTypeResponse>> Update(Guid id, ProcedureTypeUpdateRequest request, CancellationToken cancellationToken)
    {
        var type = await dbContext.ProcedureTypes.Include(item => item.Procedures)
            .SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (type is null) return NotFound();
        if (type.ConcurrencyToken != request.ConcurrencyToken) return ConcurrencyConflict();

        var normalizedName = TextNormalizer.Normalize(request.Name);
        if (await dbContext.ProcedureTypes.AnyAsync(item => item.Id != id && !item.IsArchived && item.NormalizedName == normalizedName, cancellationToken))
        {
            return NameConflict();
        }

        type.Name = request.Name.Trim();
        type.NormalizedName = normalizedName;
        type.Icon = request.Icon.Trim();
        type.ConcurrencyToken = Guid.NewGuid();
        await dbContext.SaveChangesAsync(cancellationToken);
        return Ok(ToResponse(type, type.Procedures.Count(procedure => !procedure.IsArchived)));
    }

    [HttpPost("{id:guid}/archive")]
    public async Task<IActionResult> Archive(Guid id, CancellationToken cancellationToken)
    {
        var type = await dbContext.ProcedureTypes.Include(item => item.Procedures)
            .SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (type is null) return NotFound();
        if (type.IsArchived) return NoContent();
        if (!CatalogRules.CanArchive(type))
        {
            return Conflict(new ProblemDetails { Status = 409, Title = "The type has active procedures.", Detail = "Archive its active procedures first." });
        }

        var actor = await CurrentUserAsync();
        type.IsArchived = true;
        type.ArchivedAtUtc = DateTimeOffset.UtcNow;
        type.ArchivedByUserId = actor.Id;
        type.ConcurrencyToken = Guid.NewGuid();
        auditService.Record("archived", "procedure-type", type.Id.ToString(), type.Name, actor);
        await dbContext.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [Authorize(Policy = AppPolicies.Admin)]
    [HttpPost("{id:guid}/restore")]
    public async Task<IActionResult> Restore(Guid id, CancellationToken cancellationToken)
    {
        var type = await dbContext.ProcedureTypes.SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (type is null) return NotFound();
        if (!type.IsArchived) return NoContent();
        if (await dbContext.ProcedureTypes.AnyAsync(item => item.Id != id && !item.IsArchived && item.NormalizedName == type.NormalizedName, cancellationToken))
        {
            return NameConflict();
        }

        var actor = await CurrentUserAsync();
        type.IsArchived = false;
        type.ArchivedAtUtc = null;
        type.ArchivedByUserId = null;
        type.ConcurrencyToken = Guid.NewGuid();
        auditService.Record("restored", "procedure-type", type.Id.ToString(), type.Name, actor);
        await dbContext.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    private async Task<ApplicationUser> CurrentUserAsync() =>
        await userManager.GetUserAsync(User) ?? throw new InvalidOperationException("Authenticated user not found.");

    private static ProcedureTypeResponse ToResponse(ProcedureType type, int count) =>
        new(type.Id, type.Name, type.Icon, type.IsArchived, count, type.ConcurrencyToken);

    private ConflictObjectResult NameConflict() => Conflict(new ProblemDetails { Status = 409, Title = "An active type with this name already exists." });
    private ConflictObjectResult ConcurrencyConflict() => Conflict(new ProblemDetails { Status = 409, Title = "This item changed since it was loaded.", Detail = "Reload and try again." });
}

public record ProcedureTypeRequest
{
    [Required, StringLength(120)] public required string Name { get; init; }
    [StringLength(80)] public string Icon { get; init; } = "fa-folder";
}

public sealed record ProcedureTypeUpdateRequest : ProcedureTypeRequest
{
    public Guid ConcurrencyToken { get; init; }
}

public sealed record ProcedureTypeResponse(Guid Id, string Name, string Icon, bool IsArchived, int ProcedureCount, Guid ConcurrencyToken);
