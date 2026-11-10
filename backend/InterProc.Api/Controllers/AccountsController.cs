using System.ComponentModel.DataAnnotations;
using InterProc.Api.Data;
using InterProc.Api.Security;
using InterProc.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InterProc.Api.Controllers;

[ApiController]
[Route("api/accounts")]
[Authorize(Roles = RoleNames.Admin)]
[AutoValidateAntiforgeryToken]
public sealed class AccountsController(
    IAuthService authService,
    UserManager<ApplicationUser> userManager) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<IReadOnlyList<AccountResponse>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> List(CancellationToken cancellationToken)
    {
        var users = await userManager.Users
            .OrderBy(user => user.NormalizedUserName)
            .ToListAsync(cancellationToken);

        var responses = new List<AccountResponse>(users.Count);
        foreach (var user in users)
        {
            responses.Add(await CreateResponseAsync(user));
        }

        return Ok(responses);
    }

    [HttpPost]
    [ProducesResponseType<AccountResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create(
        CreateAccountRequest request,
        CancellationToken cancellationToken)
    {
        if (!RoleNames.IsValid(request.Role))
        {
            ModelState.AddModelError(nameof(request.Role), "Choose admin or usuario.");
            return ValidationProblem(ModelState);
        }

        var (user, result) = await authService.CreateAccountAsync(
            request.Username,
            request.Email,
            request.TemporaryPassword,
            request.Role,
            cancellationToken);

        if (!result.Succeeded || user is null)
        {
            return BadRequest(new ValidationProblemDetails(
                AuthController.ToSafeValidationErrors(result)));
        }

        return Created($"/api/accounts/{user.Id}", await CreateResponseAsync(user));
    }

    [HttpPatch("{id}/active")]
    [ProducesResponseType<AccountResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SetActive(
        string id,
        SetAccountActiveRequest request,
        CancellationToken cancellationToken)
    {
        var target = await userManager.FindByIdAsync(id);
        if (target is null)
        {
            return NotFound();
        }

        var actor = await userManager.GetUserAsync(User)
            ?? throw new InvalidOperationException("The authenticated account could not be found.");
        var result = await authService.SetActiveAsync(actor, target, request.IsActive, cancellationToken);
        if (!result.Succeeded)
        {
            return BadRequest(new ValidationProblemDetails(new Dictionary<string, string[]>
            {
                ["account"] = result.Errors.Select(error => error.Description).ToArray()
            }));
        }

        return Ok(await CreateResponseAsync(target));
    }

    private async Task<AccountResponse> CreateResponseAsync(ApplicationUser user)
    {
        var roles = await userManager.GetRolesAsync(user);
        if (roles.Count != 1)
        {
            throw new InvalidOperationException("The account must have exactly one role.");
        }

        return new AccountResponse(
            user.Id,
            user.UserName!,
            user.Email!,
            roles[0],
            user.IsActive,
            user.MustChangePassword);
    }
}

public sealed record CreateAccountRequest
{
    [Required, StringLength(50, MinimumLength = 3)]
    [RegularExpression("^[A-Za-z0-9._-]+$", ErrorMessage = "Use letters, numbers, dots, underscores or hyphens.")]
    public required string Username { get; init; }

    [Required, EmailAddress, StringLength(256)]
    public required string Email { get; init; }

    [Required, StringLength(256, MinimumLength = 8)]
    public required string TemporaryPassword { get; init; }

    [Required]
    public required string Role { get; init; }
}

public sealed record SetAccountActiveRequest(bool IsActive);

public sealed record AccountResponse(
    string Id,
    string Username,
    string Email,
    string Role,
    bool IsActive,
    bool MustChangePassword);
