using Microsoft.AspNetCore.Identity;

namespace InterProc.Api.Domain;

public sealed class ApplicationUser : IdentityUser
{
    public required string DisplayName { get; set; }

    public bool IsActive { get; set; } = true;

    public bool MustChangePassword { get; set; } = true;
}
