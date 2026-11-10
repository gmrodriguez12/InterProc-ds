using InterProc.Api.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace InterProc.Api.Security;

public sealed class AccountStateMiddleware(RequestDelegate next)
{
    private static readonly PathString SessionPath = new("/api/auth/session");

    private static readonly PathString[] PasswordChangeAllowedPaths =
    [
        new("/api/auth/session"),
        new("/api/auth/logout"),
        new("/api/auth/change-password")
    ];

    public async Task InvokeAsync(
        HttpContext context,
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager)
    {
        if (context.User.Identity?.IsAuthenticated == true &&
            context.Request.Path.StartsWithSegments("/api"))
        {
            var user = await userManager.GetUserAsync(context.User);
            if (user is null || !user.IsActive)
            {
                await signInManager.SignOutAsync();

                // Session restoration is intentionally anonymous-friendly. Returning 200 with
                // no user lets the SPA recover cleanly when an administrator disabled the account.
                if (context.Request.Path.Equals(SessionPath))
                {
                    context.User = new System.Security.Claims.ClaimsPrincipal(
                        new System.Security.Claims.ClaimsIdentity());
                    await next(context);
                    return;
                }

                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                return;
            }

            if (user.MustChangePassword &&
                !PasswordChangeAllowedPaths.Any(path => context.Request.Path.StartsWithSegments(path)))
            {
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                await context.Response.WriteAsJsonAsync(new ProblemDetails
                {
                    Status = StatusCodes.Status403Forbidden,
                    Title = "Password change required",
                    Detail = "Change the temporary password before continuing."
                });
                return;
            }
        }

        await next(context);
    }
}
