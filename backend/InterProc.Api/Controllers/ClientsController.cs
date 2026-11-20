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
[Route("api/clients")]
[Authorize(Policy = AppPolicies.ActiveUser)]
public sealed class ClientsController(
    ApplicationDbContext dbContext,
    UserManager<ApplicationUser> userManager,
    AuditService auditService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ClientSummaryResponse>>> List(
        [FromQuery] bool archived = false,
        CancellationToken cancellationToken = default)
    {
        var clients = await dbContext.Clients.AsNoTracking()
            .Where(client => client.IsArchived == archived)
            .OrderBy(client => client.Name)
            .Select(client => new ClientSummaryResponse(client.Id, client.Name, client.TaxId,
                client.ContactPerson, client.Email, client.Works.Count,
                client.Works.Count(work => !work.IsArchived && work.State != WorkStates.Completed && work.State != WorkStates.Cancelled),
                client.IsArchived, client.ConcurrencyToken))
            .ToListAsync(cancellationToken);
        return Ok(clients);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ClientDetailResponse>> Get(Guid id, CancellationToken cancellationToken)
    {
        var client = await dbContext.Clients.AsNoTracking()
            .Include(item => item.Notes).ThenInclude(note => note.WorkItem)
            .Include(item => item.Works)
            .SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        return client is null ? NotFound() : Ok(ToDetail(client));
    }

    [HttpPost]
    public async Task<ActionResult<ClientDetailResponse>> Create(ClientRequest request, CancellationToken cancellationToken)
    {
        var validation = ValidateRequest(request);
        if (validation is not null) return validation;
        var normalizedName = TextNormalizer.Normalize(request.Name);
        if (await NameExists(normalizedName, null, cancellationToken)) return NameConflict();
        var client = new Client
        {
            Name = request.Name.Trim(), NormalizedName = normalizedName,
            TaxId = ClientRules.CleanOptional(request.TaxId), ContactPerson = ClientRules.CleanOptional(request.ContactPerson),
            Email = ClientRules.CleanOptional(request.Email), Phone = ClientRules.CleanOptional(request.Phone),
            Address = ClientRules.CleanOptional(request.Address), IsArchived = false
        };
        dbContext.Clients.Add(client);
        await dbContext.SaveChangesAsync(cancellationToken);
        return CreatedAtAction(nameof(Get), new { id = client.Id }, ToDetail(client));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ClientDetailResponse>> Update(Guid id, ClientUpdateRequest request, CancellationToken cancellationToken)
    {
        var validation = ValidateRequest(request);
        if (validation is not null) return validation;
        var client = await dbContext.Clients.Include(item => item.Notes).Include(item => item.Works)
            .SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (client is null) return NotFound();
        if (client.ConcurrencyToken != request.ConcurrencyToken) return ConcurrencyConflict();
        var normalizedName = TextNormalizer.Normalize(request.Name);
        if (await NameExists(normalizedName, id, cancellationToken)) return NameConflict();

        client.Name = request.Name.Trim(); client.NormalizedName = normalizedName;
        client.TaxId = ClientRules.CleanOptional(request.TaxId);
        client.ContactPerson = ClientRules.CleanOptional(request.ContactPerson);
        client.Email = ClientRules.CleanOptional(request.Email);
        client.Phone = ClientRules.CleanOptional(request.Phone);
        client.Address = ClientRules.CleanOptional(request.Address);
        client.ConcurrencyToken = Guid.NewGuid();
        await dbContext.SaveChangesAsync(cancellationToken);
        return Ok(ToDetail(client));
    }

    [HttpPost("{id:guid}/notes")]
    public async Task<ActionResult<ClientNoteResponse>> AddNote(Guid id, ClientNoteRequest request, CancellationToken cancellationToken)
    {
        var client = await dbContext.Clients.SingleOrDefaultAsync(item => item.Id == id && !item.IsArchived, cancellationToken);
        if (client is null) return NotFound();
        if (!await WorkBelongsToClient(request.WorkItemId, id, cancellationToken))
        {
            return ValidationProblemFor("workItemId", "The selected work item does not belong to this client.");
        }
        var actor = await CurrentUserAsync();
        var note = new ClientNote
        {
            ClientId = id, Client = client, WorkItemId = request.WorkItemId, Text = request.Text.Trim(),
            CreatedAtUtc = DateTimeOffset.UtcNow, CreatedByUserId = actor.Id, CreatedByDisplayName = actor.DisplayName
        };
        dbContext.ClientNotes.Add(note);
        await dbContext.SaveChangesAsync(cancellationToken);
        return CreatedAtAction(nameof(Get), new { id }, ToNote(note, null));
    }

    [HttpPut("{id:guid}/notes/{noteId:guid}")]
    public async Task<ActionResult<ClientNoteResponse>> UpdateNote(Guid id, Guid noteId, ClientNoteUpdateRequest request, CancellationToken cancellationToken)
    {
        var note = await dbContext.ClientNotes.Include(item => item.WorkItem)
            .SingleOrDefaultAsync(item => item.Id == noteId && item.ClientId == id, cancellationToken);
        if (note is null) return NotFound();
        if (note.ConcurrencyToken != request.ConcurrencyToken) return ConcurrencyConflict();
        if (!await WorkBelongsToClient(request.WorkItemId, id, cancellationToken))
        {
            return ValidationProblemFor("workItemId", "The selected work item does not belong to this client.");
        }
        var actor = await CurrentUserAsync();
        note.Text = request.Text.Trim(); note.WorkItemId = request.WorkItemId;
        note.UpdatedAtUtc = DateTimeOffset.UtcNow; note.UpdatedByUserId = actor.Id; note.UpdatedByDisplayName = actor.DisplayName;
        note.ConcurrencyToken = Guid.NewGuid();
        await dbContext.SaveChangesAsync(cancellationToken);
        if (note.WorkItemId.HasValue) note.WorkItem = await dbContext.WorkItems.FindAsync([note.WorkItemId.Value], cancellationToken);
        return Ok(ToNote(note, note.WorkItem?.Code));
    }

    [HttpPost("{id:guid}/archive")]
    public async Task<IActionResult> Archive(Guid id, CancellationToken cancellationToken)
    {
        var client = await dbContext.Clients.Include(item => item.Works)
            .SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (client is null) return NotFound();
        if (client.IsArchived) return NoContent();
        if (ClientRules.HasOpenWorks(client))
        {
            return Conflict(new ProblemDetails { Status = 409, Title = "The client has open work items.", Detail = "Only clients whose work items are all Terminado or Cancelado can be archived." });
        }
        var actor = await CurrentUserAsync();
        client.IsArchived = true; client.ArchivedAtUtc = DateTimeOffset.UtcNow; client.ArchivedByUserId = actor.Id;
        client.ConcurrencyToken = Guid.NewGuid();
        auditService.Record("archived", "client", client.Id.ToString(), client.Name, actor);
        await dbContext.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [Authorize(Policy = AppPolicies.Admin)]
    [HttpPost("{id:guid}/restore")]
    public async Task<IActionResult> Restore(Guid id, CancellationToken cancellationToken)
    {
        var client = await dbContext.Clients.SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (client is null) return NotFound();
        if (!client.IsArchived) return NoContent();
        if (await NameExists(client.NormalizedName, id, cancellationToken)) return NameConflict();
        var actor = await CurrentUserAsync();
        client.IsArchived = false; client.ArchivedAtUtc = null; client.ArchivedByUserId = null;
        client.ConcurrencyToken = Guid.NewGuid();
        auditService.Record("restored", "client", client.Id.ToString(), client.Name, actor);
        await dbContext.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    private Task<bool> NameExists(string normalizedName, Guid? excludingId, CancellationToken cancellationToken) =>
        dbContext.Clients.AnyAsync(item => item.NormalizedName == normalizedName && !item.IsArchived &&
            (!excludingId.HasValue || item.Id != excludingId.Value), cancellationToken);

    private async Task<bool> WorkBelongsToClient(Guid? workId, Guid clientId, CancellationToken cancellationToken) =>
        !workId.HasValue || await dbContext.WorkItems.AnyAsync(work => work.Id == workId.Value && work.ClientId == clientId, cancellationToken);

    private async Task<ApplicationUser> CurrentUserAsync() =>
        await userManager.GetUserAsync(User) ?? throw new InvalidOperationException("Authenticated user not found.");

    private ActionResult? ValidateRequest(ClientRequest request)
    {
        if (!string.IsNullOrWhiteSpace(request.Email) && !new EmailAddressAttribute().IsValid(request.Email))
            return ValidationProblemFor("email", "Enter a valid email address.");
        return null;
    }
    private ActionResult ValidationProblemFor(string field, string message) { ModelState.AddModelError(field, message); return ValidationProblem(ModelState); }
    private ConflictObjectResult NameConflict() => Conflict(new ProblemDetails { Status = 409, Title = "An active client with this name already exists." });
    private ConflictObjectResult ConcurrencyConflict() => Conflict(new ProblemDetails { Status = 409, Title = "This item changed since it was loaded.", Detail = "Reload and try again." });

    private static ClientDetailResponse ToDetail(Client client) => new(client.Id, client.Name, client.TaxId,
        client.ContactPerson, client.Email, client.Phone, client.Address, client.IsArchived, client.ConcurrencyToken,
        client.Works.OrderByDescending(work => work.Code).Select(ToWork).ToArray(),
        client.Notes.OrderByDescending(note => note.CreatedAtUtc).Select(note => ToNote(note, note.WorkItem?.Code)).ToArray());

    private static WorkSummaryResponse ToWork(WorkItem work) =>
        new(work.Id, work.Name, work.Code, work.State, work.ProgressPercent, work.IsArchived);

    private static ClientNoteResponse ToNote(ClientNote note, string? workCode) =>
        new(note.Id, note.WorkItemId, workCode, note.Text, note.CreatedAtUtc, note.CreatedByDisplayName,
            note.UpdatedAtUtc, note.UpdatedByDisplayName, note.ConcurrencyToken);
}

public record ClientRequest
{
    [Required, StringLength(200)] public required string Name { get; init; }
    [StringLength(100)] public string? TaxId { get; init; }
    [StringLength(160)] public string? ContactPerson { get; init; }
    [StringLength(256)] public string? Email { get; init; }
    [StringLength(80)] public string? Phone { get; init; }
    [StringLength(500)] public string? Address { get; init; }
}

public sealed record ClientUpdateRequest : ClientRequest { public Guid ConcurrencyToken { get; init; } }
public record ClientNoteRequest
{
    [Required] public required string Text { get; init; }
    public Guid? WorkItemId { get; init; }
}
public sealed record ClientNoteUpdateRequest : ClientNoteRequest { public Guid ConcurrencyToken { get; init; } }

public sealed record ClientSummaryResponse(Guid Id, string Name, string? TaxId, string? ContactPerson, string? Email,
    int WorkCount, int OpenWorkCount, bool IsArchived, Guid ConcurrencyToken);
public sealed record ClientDetailResponse(Guid Id, string Name, string? TaxId, string? ContactPerson, string? Email,
    string? Phone, string? Address, bool IsArchived, Guid ConcurrencyToken,
    IReadOnlyList<WorkSummaryResponse> Works, IReadOnlyList<ClientNoteResponse> Notes);
public sealed record WorkSummaryResponse(Guid Id, string Name, string Code, string State, int ProgressPercent, bool IsArchived);
public sealed record ClientNoteResponse(Guid Id, Guid? WorkItemId, string? WorkCode, string Text,
    DateTimeOffset CreatedAtUtc, string CreatedByDisplayName, DateTimeOffset? UpdatedAtUtc,
    string? UpdatedByDisplayName, Guid ConcurrencyToken);
