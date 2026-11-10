using System.Data;
using System.Text.RegularExpressions;
using InterProc.Api.Data;
using InterProc.Api.Security;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace InterProc.Api.Services;

public sealed class AuthService(
    ApplicationDbContext dbContext,
    UserManager<ApplicationUser> userManager,
    RoleManager<IdentityRole> roleManager) : IAuthService
{
    private static readonly Regex UsernamePattern = new(
        "^[A-Za-z0-9._-]{3,50}$",
        RegexOptions.CultureInvariant);
    private const long AccountCreationLockId = 731245602;
    private const long AccountStatusLockId = 731245603;

    public Task<bool> HasUsersAsync(CancellationToken cancellationToken) =>
        userManager.Users.AnyAsync(cancellationToken);

    public async Task<ApplicationUser?> FindByIdentifierAsync(string identifier)
    {
        var trimmed = identifier.Trim();
        return trimmed.Contains('@', StringComparison.Ordinal)
            ? await userManager.FindByEmailAsync(trimmed)
            : await userManager.FindByNameAsync(trimmed);
    }

    public async Task<IdentityResult> ChangePasswordAsync(
        ApplicationUser user,
        string currentPassword,
        string newPassword,
        CancellationToken cancellationToken)
    {
        var executionStrategy = dbContext.Database.CreateExecutionStrategy();
        return await executionStrategy.ExecuteAsync(async () =>
        {
            await using var transaction = await dbContext.Database.BeginTransactionAsync(
                IsolationLevel.ReadCommitted,
                cancellationToken);

            var passwordResult = await userManager.ChangePasswordAsync(
                user,
                currentPassword,
                newPassword);
            if (!passwordResult.Succeeded)
            {
                return passwordResult;
            }

            user.MustChangePassword = false;
            var updateResult = await userManager.UpdateAsync(user);
            if (!updateResult.Succeeded)
            {
                return updateResult;
            }

            await transaction.CommitAsync(cancellationToken);
            return IdentityResult.Success;
        });
    }

    public async Task EnsureRolesAsync()
    {
        foreach (var role in RoleNames.All)
        {
            if (await roleManager.RoleExistsAsync(role))
            {
                continue;
            }

            var result = await roleManager.CreateAsync(new IdentityRole(role));
            if (!result.Succeeded)
            {
                throw new InvalidOperationException(
                    $"The required role '{role}' could not be initialized.");
            }
        }
    }

    public async Task<(ApplicationUser? User, IdentityResult Result)> CreateAccountAsync(
        string username,
        string email,
        string password,
        string role,
        CancellationToken cancellationToken)
    {
        var trimmedUsername = username.Trim();
        var trimmedEmail = email.Trim();
        if (!UsernamePattern.IsMatch(trimmedUsername))
        {
            return (null, IdentityResult.Failed(new IdentityError
            {
                Code = "InvalidUserName",
                Description = "Use 3–50 letters, numbers, dots, underscores or hyphens."
            }));
        }

        if (!RoleNames.IsValid(role))
        {
            return (null, IdentityResult.Failed(new IdentityError
            {
                Code = "InvalidRole",
                Description = "Choose admin or usuario."
            }));
        }

        var executionStrategy = dbContext.Database.CreateExecutionStrategy();
        return await executionStrategy.ExecuteAsync<(ApplicationUser? User, IdentityResult Result)>(async () =>
        {
            await using var transaction = await dbContext.Database.BeginTransactionAsync(
                IsolationLevel.ReadCommitted,
                cancellationToken);

            await dbContext.Database.ExecuteSqlRawAsync(
                $"SELECT pg_advisory_xact_lock({AccountCreationLockId})",
                cancellationToken);

            await EnsureRolesAsync();

            var normalizedRole = RoleNames.Normalize(role);
            var user = new ApplicationUser
            {
                UserName = trimmedUsername,
                Email = trimmedEmail,
                IsActive = true,
                MustChangePassword = true
            };

            var createResult = await userManager.CreateAsync(user, password);
            if (!createResult.Succeeded)
            {
                return (null, createResult);
            }

            var roleResult = await userManager.AddToRoleAsync(user, normalizedRole);
            if (!roleResult.Succeeded)
            {
                throw new InvalidOperationException("The new account could not be assigned its default role.");
            }

            await transaction.CommitAsync(cancellationToken);
            return (user, IdentityResult.Success);
        });
    }

    public async Task<IdentityResult> SetActiveAsync(
        ApplicationUser actor,
        ApplicationUser target,
        bool isActive,
        CancellationToken cancellationToken)
    {
        if (!isActive && actor.Id == target.Id)
        {
            return IdentityResult.Failed(new IdentityError
            {
                Code = "SelfDeactivation",
                Description = "You cannot deactivate your own account."
            });
        }

        var executionStrategy = dbContext.Database.CreateExecutionStrategy();
        return await executionStrategy.ExecuteAsync(async () =>
        {
            await using var transaction = await dbContext.Database.BeginTransactionAsync(
                IsolationLevel.ReadCommitted,
                cancellationToken);

            await dbContext.Database.ExecuteSqlRawAsync(
                $"SELECT pg_advisory_xact_lock({AccountStatusLockId})",
                cancellationToken);

            await dbContext.Entry(target).ReloadAsync(cancellationToken);
            if (target.IsActive == isActive)
            {
                await transaction.CommitAsync(cancellationToken);
                return IdentityResult.Success;
            }

            if (!isActive && await userManager.IsInRoleAsync(target, RoleNames.Admin))
            {
                var normalizedAdminRole = RoleNames.Admin.ToUpperInvariant();
                var activeAdminCount = await (
                    from user in dbContext.Users.AsNoTracking()
                    join userRole in dbContext.UserRoles.AsNoTracking()
                        on user.Id equals userRole.UserId
                    join role in dbContext.Roles.AsNoTracking()
                        on userRole.RoleId equals role.Id
                    where user.IsActive && role.NormalizedName == normalizedAdminRole
                    select user.Id)
                    .Distinct()
                    .CountAsync(cancellationToken);

                if (activeAdminCount <= 1)
                {
                    return IdentityResult.Failed(new IdentityError
                    {
                        Code = "LastActiveAdmin",
                        Description = "The last active administrator cannot be deactivated."
                    });
                }
            }

            target.IsActive = isActive;
            var result = await userManager.UpdateSecurityStampAsync(target);
            if (!result.Succeeded)
            {
                return result;
            }

            await transaction.CommitAsync(cancellationToken);
            return IdentityResult.Success;
        });
    }
}
