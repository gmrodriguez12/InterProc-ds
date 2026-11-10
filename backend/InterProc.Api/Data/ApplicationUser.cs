using Microsoft.AspNetCore.Identity;

namespace InterProc.Api.Data;

public sealed class ApplicationUser : IdentityUser
{
    public bool IsActive { get; set; } = true;

    public bool MustChangePassword { get; set; } = true;
}
