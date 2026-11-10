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
[Route("api/procedures")]
[Authorize(Policy = AppPolicies.ActiveUser)]
public sealed class ProceduresController(
    ApplicationDbContext dbContext,
    UserManager<ApplicationUser> userManager,
    AuditService auditService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ProcedureSummaryResponse>>> List(
        [FromQuery] Guid? typeId = null,
        [FromQuery] bool archived = false,
        [FromQuery] string? search = null,
        CancellationToken cancellationToken = default)
    {
        var query = dbContext.Procedures.AsNoTracking().Where(procedure => procedure.IsArchived == archived);
        if (typeId.HasValue) query = query.Where(procedure => procedure.ProcedureTypeId == typeId.Value);
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(procedure => procedure.Title.ToLower().Contains(term) || procedure.ShortDescription.ToLower().Contains(term));
        }

        return Ok(await query.OrderBy(procedure => procedure.Title)
            .Select(procedure => new ProcedureSummaryResponse(procedure.Id, procedure.ProcedureTypeId,
                procedure.ProcedureType.Name, procedure.Title, procedure.Icon, procedure.ShortDescription,
                procedure.EstimatedMinutes, procedure.CurrentVersionNumber, procedure.IsArchived, procedure.ConcurrencyToken))
            .ToListAsync(cancellationToken));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ProcedureDetailResponse>> Get(Guid id, CancellationToken cancellationToken)
    {
        var procedure = await dbContext.Procedures.AsNoTracking()
            .Include(item => item.ProcedureType).Include(item => item.Versions)
            .SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        return procedure is null ? NotFound() : Ok(ToDetail(procedure));
    }

    [HttpPost]
    public async Task<ActionResult<ProcedureDetailResponse>> Create(ProcedureCreateRequest request, CancellationToken cancellationToken)
    {
        var type = await dbContext.ProcedureTypes.SingleOrDefaultAsync(item => item.Id == request.ProcedureTypeId && !item.IsArchived, cancellationToken);
        if (type is null) return ValidationProblemFor("procedureTypeId", "Select an active procedure type.");
        var normalizedTitle = TextNormalizer.Normalize(request.Title);
        if (await TitleExists(request.ProcedureTypeId, normalizedTitle, null, cancellationToken)) return TitleConflict();
        var actor = await CurrentUserAsync();
        var procedure = new Procedure
        {
            ProcedureTypeId = type.Id,
            ProcedureType = type,
            Title = request.Title.Trim(),
            NormalizedTitle = normalizedTitle,
            Icon = request.Icon.Trim(),
            ShortDescription = request.ShortDescription.Trim(),
            EstimatedMinutes = request.EstimatedMinutes,
            CurrentVersionNumber = 1,
            IsArchived = false
        };
        procedure.Versions.Add(new ProcedureVersion
        {
            Procedure = procedure,
            Number = 1,
            Steps = request.Steps.Trim(),
            MermaidDiagram = CatalogRules.CleanOptional(request.MermaidDiagram),
            Reason = "Creación inicial",
            CreatedAtUtc = DateTimeOffset.UtcNow,
            CreatedByUserId = actor.Id,
            CreatedByDisplayName = actor.DisplayName
        });
        dbContext.Procedures.Add(procedure);
        await dbContext.SaveChangesAsync(cancellationToken);
        return CreatedAtAction(nameof(Get), new { id = procedure.Id }, ToDetail(procedure));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ProcedureDetailResponse>> Update(Guid id, ProcedureUpdateRequest request, CancellationToken cancellationToken)
    {
        var procedure = await dbContext.Procedures.Include(item => item.ProcedureType).Include(item => item.Versions)
            .SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (procedure is null) return NotFound();
        if (procedure.ConcurrencyToken != request.ConcurrencyToken) return ConcurrencyConflict();
        var type = await dbContext.ProcedureTypes.SingleOrDefaultAsync(item => item.Id == request.ProcedureTypeId && !item.IsArchived, cancellationToken);
        if (type is null) return ValidationProblemFor("procedureTypeId", "Select an active procedure type.");

        var normalizedTitle = TextNormalizer.Normalize(request.Title);
        if (await TitleExists(type.Id, normalizedTitle, id, cancellationToken)) return TitleConflict();
        var current = procedure.Versions.Single(version => version.Number == procedure.CurrentVersionNumber);
        var diagram = CatalogRules.CleanOptional(request.MermaidDiagram);
        var versionChanged = CatalogRules.VersionContentChanged(current, request.Steps, request.MermaidDiagram);
        if (versionChanged && string.IsNullOrWhiteSpace(request.VersionReason))
        {
            return ValidationProblemFor("versionReason", "A reason is required when steps or diagram change.");
        }

        procedure.ProcedureTypeId = type.Id;
        procedure.ProcedureType = type;
        procedure.Title = request.Title.Trim();
        procedure.NormalizedTitle = normalizedTitle;
        procedure.Icon = request.Icon.Trim();
        procedure.ShortDescription = request.ShortDescription.Trim();
        procedure.EstimatedMinutes = request.EstimatedMinutes;
        procedure.ConcurrencyToken = Guid.NewGuid();
        if (versionChanged)
        {
            var actor = await CurrentUserAsync();
            procedure.CurrentVersionNumber++;
            procedure.Versions.Add(new ProcedureVersion
            {
                ProcedureId = procedure.Id,
                Procedure = procedure,
                Number = procedure.CurrentVersionNumber,
                Steps = request.Steps.Trim(),
                MermaidDiagram = diagram,
                Reason = request.VersionReason!.Trim(),
                CreatedAtUtc = DateTimeOffset.UtcNow,
                CreatedByUserId = actor.Id,
                CreatedByDisplayName = actor.DisplayName
            });
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        return Ok(ToDetail(procedure));
    }

    [HttpGet("{id:guid}/versions")]
    public async Task<ActionResult<IReadOnlyList<ProcedureVersionResponse>>> Versions(Guid id, CancellationToken cancellationToken)
    {
        var currentNumber = await dbContext.Procedures.Where(item => item.Id == id)
            .Select(item => (int?)item.CurrentVersionNumber).SingleOrDefaultAsync(cancellationToken);
        if (!currentNumber.HasValue) return NotFound();
        return Ok(await dbContext.ProcedureVersions.AsNoTracking().Where(version => version.ProcedureId == id)
            .OrderByDescending(version => version.Number)
            .Select(version => new ProcedureVersionResponse(version.Id, version.Number, version.Steps,
                version.MermaidDiagram, version.Reason, version.CreatedAtUtc, version.CreatedByDisplayName,
                version.SourceWorkId, version.Number == currentNumber.Value))
            .ToListAsync(cancellationToken));
    }

    [Authorize(Policy = AppPolicies.Admin)]
    [HttpDelete("{id:guid}/versions/{versionId:guid}")]
    public async Task<IActionResult> DeleteVersion(Guid id, Guid versionId, CancellationToken cancellationToken)
    {
        var procedure = await dbContext.Procedures.SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (procedure is null) return NotFound();
        var version = await dbContext.ProcedureVersions.SingleOrDefaultAsync(item => item.Id == versionId && item.ProcedureId == id, cancellationToken);
        if (version is null) return NotFound();
        if (!CatalogRules.CanDelete(version, procedure.CurrentVersionNumber))
        {
            return Conflict(new ProblemDetails { Status = 409, Title = "The current or a used version cannot be deleted." });
        }
        dbContext.ProcedureVersions.Remove(version);
        await dbContext.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpPost("{id:guid}/archive")]
    public Task<IActionResult> Archive(Guid id, CancellationToken cancellationToken) => SetArchived(id, true, cancellationToken);

    [Authorize(Policy = AppPolicies.Admin)]
    [HttpPost("{id:guid}/restore")]
    public Task<IActionResult> Restore(Guid id, CancellationToken cancellationToken) => SetArchived(id, false, cancellationToken);

    private async Task<IActionResult> SetArchived(Guid id, bool archived, CancellationToken cancellationToken)
    {
        var procedure = await dbContext.Procedures.SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (procedure is null) return NotFound();
        if (procedure.IsArchived == archived) return NoContent();
        if (!archived && await TitleExists(procedure.ProcedureTypeId, procedure.NormalizedTitle, id, cancellationToken)) return TitleConflict();
        var actor = await CurrentUserAsync();
        procedure.IsArchived = archived;
        procedure.ArchivedAtUtc = archived ? DateTimeOffset.UtcNow : null;
        procedure.ArchivedByUserId = archived ? actor.Id : null;
        procedure.ConcurrencyToken = Guid.NewGuid();
        auditService.Record(archived ? "archived" : "restored", "procedure", procedure.Id.ToString(), procedure.Title, actor);
        await dbContext.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    private Task<bool> TitleExists(Guid typeId, string normalizedTitle, Guid? excludingId, CancellationToken cancellationToken) =>
        dbContext.Procedures.AnyAsync(item => item.ProcedureTypeId == typeId && item.NormalizedTitle == normalizedTitle &&
            !item.IsArchived && (!excludingId.HasValue || item.Id != excludingId.Value), cancellationToken);

    private async Task<ApplicationUser> CurrentUserAsync() =>
        await userManager.GetUserAsync(User) ?? throw new InvalidOperationException("Authenticated user not found.");

    private ActionResult ValidationProblemFor(string field, string message) { ModelState.AddModelError(field, message); return ValidationProblem(ModelState); }
    private ConflictObjectResult TitleConflict() => Conflict(new ProblemDetails { Status = 409, Title = "An active procedure with this title already exists in the selected type." });
    private ConflictObjectResult ConcurrencyConflict() => Conflict(new ProblemDetails { Status = 409, Title = "This procedure changed since it was loaded.", Detail = "Reload and try again." });

    private static ProcedureDetailResponse ToDetail(Procedure procedure)
    {
        var version = procedure.Versions.Single(item => item.Number == procedure.CurrentVersionNumber);
        return new ProcedureDetailResponse(procedure.Id, procedure.ProcedureTypeId, procedure.ProcedureType.Name,
            procedure.Title, procedure.Icon, procedure.ShortDescription, procedure.EstimatedMinutes,
            procedure.CurrentVersionNumber, version.Steps, version.MermaidDiagram, procedure.IsArchived, procedure.ConcurrencyToken);
    }
}

public record ProcedureCreateRequest
{
    public Guid ProcedureTypeId { get; init; }
    [Required, StringLength(180)] public required string Title { get; init; }
    [StringLength(80)] public string Icon { get; init; } = "fa-list-check";
    [StringLength(500)] public string ShortDescription { get; init; } = "";
    [Range(1, 525600)] public int? EstimatedMinutes { get; init; }
    [Required] public required string Steps { get; init; }
    public string? MermaidDiagram { get; init; }
}

public sealed record ProcedureUpdateRequest : ProcedureCreateRequest
{
    public Guid ConcurrencyToken { get; init; }
    [StringLength(500)] public string? VersionReason { get; init; }
}

public sealed record ProcedureSummaryResponse(Guid Id, Guid ProcedureTypeId, string ProcedureTypeName, string Title,
    string Icon, string ShortDescription, int? EstimatedMinutes, int CurrentVersionNumber, bool IsArchived, Guid ConcurrencyToken);

public sealed record ProcedureDetailResponse(Guid Id, Guid ProcedureTypeId, string ProcedureTypeName, string Title,
    string Icon, string ShortDescription, int? EstimatedMinutes, int CurrentVersionNumber, string Steps,
    string? MermaidDiagram, bool IsArchived, Guid ConcurrencyToken);

public sealed record ProcedureVersionResponse(Guid Id, int Number, string Steps, string? MermaidDiagram,
    string Reason, DateTimeOffset CreatedAtUtc, string CreatedByDisplayName, Guid? SourceWorkId, bool IsCurrent);
