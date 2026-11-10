using InterProc.Api.Data;
using InterProc.Api.Security;
using Microsoft.AspNetCore.Identity;

namespace InterProc.Api.Services;

public sealed class AdminBootstrapService(
    IConfiguration configuration,
    IAuthService authService,
    UserManager<ApplicationUser> userManager)
{
    public async Task RunAsync(CancellationToken cancellationToken)
    {
        var username = GetRequired("BootstrapAdmin:Username");
        var email = GetRequired("BootstrapAdmin:Email");
        var password = GetRequired("BootstrapAdmin:Password");

        var existingByName = await userManager.FindByNameAsync(username);
        var existingByEmail = await userManager.FindByEmailAsync(email);
        if (existingByName is not null || existingByEmail is not null)
        {
            if (existingByName?.Id != existingByEmail?.Id || existingByName is null)
            {
                throw new InvalidOperationException(
                    "Bootstrap username or email collides with an existing account.");
            }

            var roles = await userManager.GetRolesAsync(existingByName);
            if (!existingByName.IsActive ||
                roles.Count != 1 ||
                !roles[0].Equals(RoleNames.Admin, StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException(
                    "The bootstrap account exists but is not an active administrator.");
            }

            await authService.EnsureRolesAsync();
            Console.WriteLine("The bootstrap administrator already exists.");
            return;
        }

        var (user, result) = await authService.CreateAccountAsync(
            username,
            email,
            password,
            RoleNames.Admin,
            cancellationToken);

        if (!result.Succeeded || user is null)
        {
            var errors = string.Join(", ", result.Errors.Select(error => error.Description));
            throw new InvalidOperationException(
                $"The bootstrap administrator could not be created: {errors}");
        }

        Console.WriteLine("The bootstrap administrator was created and must change its password on first login.");
    }

    private string GetRequired(string key)
    {
        var value = configuration[key];
        return string.IsNullOrWhiteSpace(value)
            ? throw new InvalidOperationException(
                $"Required bootstrap setting '{key}' is missing.")
            : value;
    }
}
