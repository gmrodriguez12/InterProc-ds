using System.Data;
using InterProc.Api.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace InterProc.Api.Services;

public sealed class AuthService(
    ApplicationDbContext dbContext,
    UserManager<IdentityUser> userManager,
    RoleManager<IdentityRole> roleManager) : IAuthService
{
    private const string AdminRole = "Admin";
    private const string UserRole = "User";
    private const long RegistrationLockId = 731245602;

    public Task<bool> HasUsersAsync(CancellationToken cancellationToken) =>
        userManager.Users.AnyAsync(cancellationToken);

    public async Task<(IdentityUser? User, IdentityResult Result)> RegisterAsync(
        string email,
        string password,
        CancellationToken cancellationToken)
    {
        var executionStrategy = dbContext.Database.CreateExecutionStrategy();
        return await executionStrategy.ExecuteAsync<(IdentityUser? User, IdentityResult Result)>(async () =>
        {
            await using var transaction = await dbContext.Database.BeginTransactionAsync(
                IsolationLevel.ReadCommitted,
                cancellationToken);

            await dbContext.Database.ExecuteSqlRawAsync(
                $"SELECT pg_advisory_xact_lock({RegistrationLockId})",
                cancellationToken);

            await EnsureRoleExistsAsync(AdminRole);
            await EnsureRoleExistsAsync(UserRole);

            var role = await userManager.Users.AnyAsync(cancellationToken)
                ? UserRole
                : AdminRole;
            var user = new IdentityUser
            {
                UserName = email,
                Email = email
            };

            var createResult = await userManager.CreateAsync(user, password);
            if (!createResult.Succeeded)
            {
                return (null, createResult);
            }

            var roleResult = await userManager.AddToRoleAsync(user, role);
            if (!roleResult.Succeeded)
            {
                throw new InvalidOperationException("The new account could not be assigned its default role.");
            }

            await transaction.CommitAsync(cancellationToken);
            return (user, IdentityResult.Success);
        });
    }

    private async Task EnsureRoleExistsAsync(string roleName)
    {
        if (await roleManager.RoleExistsAsync(roleName))
        {
            return;
        }

        var result = await roleManager.CreateAsync(new IdentityRole(roleName));
        if (!result.Succeeded)
        {
            throw new InvalidOperationException("The default account roles could not be initialized.");
        }
    }
}
