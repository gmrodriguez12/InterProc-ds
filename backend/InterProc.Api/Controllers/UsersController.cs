using System.ComponentModel.DataAnnotations;
using InterProc.Api.Domain;
using InterProc.Api.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InterProc.Api.Controllers;

[ApiController]
[Route("api/users")]
[Authorize(Policy = AppPolicies.Admin)]
public sealed class UsersController(
    UserManager<ApplicationUser> userManager,
    RoleManager<IdentityRole> roleManager) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<UserResponse>>> List(CancellationToken cancellationToken)
    {
        var users = await userManager.Users.OrderBy(user => user.DisplayName).ToListAsync(cancellationToken);
        var responses = new List<UserResponse>(users.Count);
        foreach (var user in users)
        {
            responses.Add(await ToResponseAsync(user));
        }

        return Ok(responses);
    }

    [HttpPost]
    public async Task<ActionResult<UserResponse>> Create(CreateUserRequest request)
    {
        if (!AppRoles.All.Contains(request.Role, StringComparer.Ordinal))
        {
            ModelState.AddModelError(nameof(request.Role), "The selected role is invalid.");
            return ValidationProblem(ModelState);
        }

        await EnsureRolesAsync();
        var user = new ApplicationUser
        {
            DisplayName = request.DisplayName.Trim(),
            UserName = request.Username.Trim(),
            Email = request.Email.Trim(),
            IsActive = true,
            MustChangePassword = true
        };
        var createResult = await userManager.CreateAsync(user, request.TemporaryPassword);
        if (!createResult.Succeeded)
        {
            return IdentityValidationProblem(createResult);
        }

        var roleResult = await userManager.AddToRoleAsync(user, request.Role);
        if (!roleResult.Succeeded)
        {
            await userManager.DeleteAsync(user);
            return IdentityValidationProblem(roleResult);
        }

        return CreatedAtAction(nameof(List), await ToResponseAsync(user));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<UserResponse>> Update(string id, UpdateUserRequest request)
    {
        var user = await userManager.FindByIdAsync(id);
        if (user is null)
        {
            return NotFound();
        }

        if (!AppRoles.All.Contains(request.Role, StringComparer.Ordinal))
        {
            ModelState.AddModelError(nameof(request.Role), "The selected role is invalid.");
            return ValidationProblem(ModelState);
        }

        var currentRoles = await userManager.GetRolesAsync(user);
        var removesAdmin = currentRoles.Contains(AppRoles.Admin) &&
            (request.Role != AppRoles.Admin || !request.IsActive);
        if (removesAdmin && await IsLastActiveAdminAsync(user.Id))
        {
            return Conflict(new ProblemDetails
            {
                Status = StatusCodes.Status409Conflict,
                Title = "The last active administrator is protected.",
                Detail = "Create or activate another administrator before changing this account."
            });
        }

        user.DisplayName = request.DisplayName.Trim();
        user.UserName = request.Username.Trim();
        user.Email = request.Email.Trim();
        user.IsActive = request.IsActive;
        var updateResult = await userManager.UpdateAsync(user);
        if (!updateResult.Succeeded)
        {
            return IdentityValidationProblem(updateResult);
        }

        if (currentRoles.Count != 1 || currentRoles[0] != request.Role)
        {
            var removeResult = await userManager.RemoveFromRolesAsync(user, currentRoles);
            if (!removeResult.Succeeded)
            {
                return IdentityValidationProblem(removeResult);
            }
            var addResult = await userManager.AddToRoleAsync(user, request.Role);
            if (!addResult.Succeeded)
            {
                return IdentityValidationProblem(addResult);
            }
        }

        await userManager.UpdateSecurityStampAsync(user);
        return Ok(await ToResponseAsync(user));
    }

    [HttpPost("{id}/temporary-password")]
    public async Task<ActionResult> ResetPassword(string id, ResetPasswordRequest request)
    {
        var user = await userManager.FindByIdAsync(id);
        if (user is null)
        {
            return NotFound();
        }

        var token = await userManager.GeneratePasswordResetTokenAsync(user);
        var result = await userManager.ResetPasswordAsync(user, token, request.TemporaryPassword);
        if (!result.Succeeded)
        {
            return IdentityValidationProblem(result);
        }

        user.MustChangePassword = true;
        var update = await userManager.UpdateAsync(user);
        return update.Succeeded ? NoContent() : IdentityValidationProblem(update);
    }

    private async Task EnsureRolesAsync()
    {
        foreach (var role in AppRoles.All)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                var result = await roleManager.CreateAsync(new IdentityRole(role));
                if (!result.Succeeded)
                {
                    throw new InvalidOperationException($"Role '{role}' could not be created.");
                }
            }
        }
    }

    private async Task<bool> IsLastActiveAdminAsync(string userId)
    {
        var admins = await userManager.GetUsersInRoleAsync(AppRoles.Admin);
        return admins.Count(admin => admin.IsActive && admin.Id != userId) == 0;
    }

    private async Task<UserResponse> ToResponseAsync(ApplicationUser user) =>
        new(user.Id, user.DisplayName, user.UserName!, user.Email!,
            (await userManager.GetRolesAsync(user)).SingleOrDefault() ?? AppRoles.User,
            user.IsActive, user.MustChangePassword);

    private ActionResult IdentityValidationProblem(IdentityResult result)
    {
        foreach (var error in result.Errors)
        {
            ModelState.AddModelError(error.Code.StartsWith("Password", StringComparison.Ordinal)
                ? "temporaryPassword"
                : "account", error.Description);
        }
        return ValidationProblem(ModelState);
    }
}

public sealed record CreateUserRequest
{
    [Required, StringLength(160)] public required string DisplayName { get; init; }
    [Required, StringLength(256)] public required string Username { get; init; }
    [Required, EmailAddress, StringLength(256)] public required string Email { get; init; }
    [Required] public required string Role { get; init; }
    [Required, StringLength(256, MinimumLength = 8)] public required string TemporaryPassword { get; init; }
}

public sealed record UpdateUserRequest
{
    [Required, StringLength(160)] public required string DisplayName { get; init; }
    [Required, StringLength(256)] public required string Username { get; init; }
    [Required, EmailAddress, StringLength(256)] public required string Email { get; init; }
    [Required] public required string Role { get; init; }
    public bool IsActive { get; init; }
}

public sealed record ResetPasswordRequest
{
    [Required, StringLength(256, MinimumLength = 8)] public required string TemporaryPassword { get; init; }
}

public sealed record UserResponse(
    string Id,
    string DisplayName,
    string Username,
    string Email,
    string Role,
    bool IsActive,
    bool MustChangePassword);
