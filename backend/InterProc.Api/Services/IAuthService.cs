using InterProc.Api.Domain;
using Microsoft.AspNetCore.Identity;

namespace InterProc.Api.Services;

public interface IAuthService
{
    Task<ApplicationUser?> FindByIdentifierAsync(string identifier);

    Task<SignInResult> PasswordSignInAsync(ApplicationUser user, string password);
}
