using Microsoft.AspNetCore.Identity;

namespace InterProc.Api.Services;

public interface IAuthService
{
    Task<bool> HasUsersAsync(CancellationToken cancellationToken);

    Task<(IdentityUser? User, IdentityResult Result)> RegisterAsync(
        string email,
        string password,
        CancellationToken cancellationToken);
}
