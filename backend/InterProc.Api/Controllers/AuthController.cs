using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using InterProc.Api.Domain;
using InterProc.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InterProc.Api.Controllers;

[ApiController]
[Route("api/auth")]
[AutoValidateAntiforgeryToken]
public sealed class AuthController(
    IAuthService authService,
    UserManager<ApplicationUser> userManager,
    SignInManager<ApplicationUser> signInManager,
    IAntiforgery antiforgery,
    IWebHostEnvironment environment) : ControllerBase
{
    [HttpPost("login")]
    public async Task<ActionResult<AuthenticatedUserResponse>> Login(SignInRequest request)
    {
        var user = await authService.FindByIdentifierAsync(request.Identifier);
        if (user is null || !user.IsActive)
        {
            return UnauthorizedProblem();
        }

        var result = await authService.PasswordSignInAsync(user, request.Password);
        if (!result.Succeeded)
        {
            return UnauthorizedProblem();
        }

        StoreAntiforgeryToken();
        return Ok(await CreateUserResponseAsync(user));
    }

    [Authorize]
    [HttpPost("change-password")]
    public async Task<ActionResult<AuthenticatedUserResponse>> ChangePassword(ChangePasswordRequest request)
    {
        var user = await userManager.GetUserAsync(User);
        if (user is null || !user.IsActive)
        {
            return Unauthorized();
        }

        var result = await userManager.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);
        if (!result.Succeeded)
        {
            return BadRequest(new ValidationProblemDetails(ToSafeValidationErrors(result)));
        }

        user.MustChangePassword = false;
        EnsureSuccess(await userManager.UpdateAsync(user));
        await signInManager.RefreshSignInAsync(user);
        StoreAntiforgeryToken();
        return Ok(await CreateUserResponseAsync(user));
    }

    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        await signInManager.SignOutAsync();
        HttpContext.User = new ClaimsPrincipal(new ClaimsIdentity());
        StoreAntiforgeryToken();
        return NoContent();
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<AuthenticatedUserResponse>> Me()
    {
        var user = await userManager.GetUserAsync(User);
        return user is null || !user.IsActive
            ? Unauthorized()
            : Ok(await CreateUserResponseAsync(user));
    }

    [HttpGet("setup-status")]
    public async Task<ActionResult<SetupStatusResponse>> SetupStatus(CancellationToken cancellationToken)
    {
        StoreAntiforgeryToken();
        return Ok(new SetupStatusResponse(await userManager.Users.AnyAsync(cancellationToken)));
    }

    private UnauthorizedObjectResult UnauthorizedProblem() => Unauthorized(new ProblemDetails
    {
        Status = StatusCodes.Status401Unauthorized,
        Title = "Authentication failed",
        Detail = "The username, email, or password is incorrect."
    });

    private void StoreAntiforgeryToken()
    {
        var tokens = antiforgery.GetAndStoreTokens(HttpContext);
        Response.Cookies.Append("XSRF-TOKEN", tokens.RequestToken!, new CookieOptions
        {
            HttpOnly = false,
            Secure = !environment.IsDevelopment(),
            SameSite = SameSiteMode.Lax,
            Path = "/"
        });
    }

    private async Task<AuthenticatedUserResponse> CreateUserResponseAsync(ApplicationUser user) =>
        new(user.Id, user.DisplayName, user.UserName!, user.Email!,
            await userManager.GetRolesAsync(user), user.MustChangePassword, user.IsActive);

    internal static IDictionary<string, string[]> ToSafeValidationErrors(IdentityResult result) =>
        result.Errors
            .GroupBy(error => error.Code.StartsWith("Password", StringComparison.Ordinal) ? "password" : "account")
            .ToDictionary(group => group.Key,
                group => group.Select(error => error.Description).Distinct(StringComparer.Ordinal).ToArray(),
                StringComparer.Ordinal);

    private static void EnsureSuccess(IdentityResult result)
    {
        if (!result.Succeeded)
        {
            throw new InvalidOperationException("The account could not be updated.");
        }
    }
}

public sealed record SignInRequest
{
    [Required, StringLength(256)] public required string Identifier { get; init; }
    [Required, StringLength(256)] public required string Password { get; init; }
}

public sealed record ChangePasswordRequest
{
    [Required, StringLength(256)] public required string CurrentPassword { get; init; }
    [Required, StringLength(256, MinimumLength = 8)] public required string NewPassword { get; init; }
}

public sealed record SetupStatusResponse(bool HasUsers);

public sealed record AuthenticatedUserResponse(
    string Id,
    string DisplayName,
    string Username,
    string Email,
    IList<string> Roles,
    bool MustChangePassword,
    bool IsActive);
