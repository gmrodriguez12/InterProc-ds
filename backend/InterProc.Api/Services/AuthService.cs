using InterProc.Api.Domain;
using Microsoft.AspNetCore.Identity;

namespace InterProc.Api.Services;

public sealed class AuthService(
    UserManager<ApplicationUser> userManager,
    SignInManager<ApplicationUser> signInManager) : IAuthService
{
    public async Task<ApplicationUser?> FindByIdentifierAsync(string identifier)
    {
        var normalized = identifier.Trim();
        return await userManager.FindByNameAsync(normalized)
            ?? await userManager.FindByEmailAsync(normalized);
    }

    public Task<SignInResult> PasswordSignInAsync(ApplicationUser user, string password) =>
        signInManager.PasswordSignInAsync(user, password, false, true);
}
