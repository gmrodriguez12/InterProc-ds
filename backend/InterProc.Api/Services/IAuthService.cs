using InterProc.Api.Data;
using Microsoft.AspNetCore.Identity;

namespace InterProc.Api.Services;

public interface IAuthService
{
    Task<bool> HasUsersAsync(CancellationToken cancellationToken);

    Task<ApplicationUser?> FindByIdentifierAsync(string identifier);

    Task<IdentityResult> ChangePasswordAsync(
        ApplicationUser user,
        string currentPassword,
        string newPassword,
        CancellationToken cancellationToken);

    Task EnsureRolesAsync();

    Task<(ApplicationUser? User, IdentityResult Result)> CreateAccountAsync(
        string username,
        string email,
        string password,
        string role,
        CancellationToken cancellationToken);

    Task<IdentityResult> SetActiveAsync(
        ApplicationUser actor,
        ApplicationUser target,
        bool isActive,
        CancellationToken cancellationToken);
}
