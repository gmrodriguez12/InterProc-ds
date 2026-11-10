using System.Data;
using InterProc.Api.Data;
using InterProc.Api.Domain;
using InterProc.Api.Security;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace InterProc.Api.Services;

public sealed class BootstrapService(
    ApplicationDbContext dbContext,
    UserManager<ApplicationUser> userManager,
    RoleManager<IdentityRole> roleManager)
{
    private const long BootstrapLockId = 731245602;

    public async Task BootstrapAdminAsync(
        string displayName,
        string username,
        string email,
        string password,
        CancellationToken cancellationToken)
    {
        var strategy = dbContext.Database.CreateExecutionStrategy();
        await strategy.ExecuteAsync(async () =>
        {
            await using var transaction = await dbContext.Database.BeginTransactionAsync(
                IsolationLevel.ReadCommitted,
                cancellationToken);
            await dbContext.Database.ExecuteSqlRawAsync(
                $"SELECT pg_advisory_xact_lock({BootstrapLockId})",
                cancellationToken);

            foreach (var role in AppRoles.All)
            {
                if (!await roleManager.RoleExistsAsync(role))
                {
                    EnsureSuccess(await roleManager.CreateAsync(new IdentityRole(role)));
                }
            }

            if (await userManager.Users.AnyAsync(cancellationToken))
            {
                throw new InvalidOperationException("Bootstrap refused because at least one account already exists.");
            }

            var admin = new ApplicationUser
            {
                DisplayName = displayName.Trim(),
                UserName = username.Trim(),
                Email = email.Trim(),
                IsActive = true,
                MustChangePassword = true
            };
            EnsureSuccess(await userManager.CreateAsync(admin, password));
            EnsureSuccess(await userManager.AddToRoleAsync(admin, AppRoles.Admin));
            await transaction.CommitAsync(cancellationToken);
        });
    }

    private static void EnsureSuccess(IdentityResult result)
    {
        if (!result.Succeeded)
        {
            throw new InvalidOperationException(string.Join("; ", result.Errors.Select(error => error.Description)));
        }
    }
}
