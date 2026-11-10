using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using InterProc.Api.Data;
using InterProc.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

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
    [AllowAnonymous]
    [HttpPost("login")]
    [ProducesResponseType<AuthenticatedUserResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login(SignInRequest request)
    {
        var user = await authService.FindByIdentifierAsync(request.Identifier);
        if (user is null || !user.IsActive)
        {
            return AuthenticationFailed();
        }

        var result = await signInManager.PasswordSignInAsync(
            user,
            request.Password,
            isPersistent: false,
            lockoutOnFailure: true);

        if (!result.Succeeded)
        {
            return AuthenticationFailed();
        }

        StoreAntiforgeryToken();
        return Ok(await CreateUserResponseAsync(user));
    }

    [AllowAnonymous]
    [HttpGet("session")]
    [ProducesResponseType<SessionResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Session(CancellationToken cancellationToken)
    {
        StoreAntiforgeryToken();

        AuthenticatedUserResponse? currentUser = null;
        if (User.Identity?.IsAuthenticated == true)
        {
            var user = await userManager.GetUserAsync(User);
            if (user is not null && user.IsActive)
            {
                currentUser = await CreateUserResponseAsync(user);
            }
        }

        return Ok(new SessionResponse(
            currentUser,
            !await authService.HasUsersAsync(cancellationToken)));
    }

    [Authorize]
    [HttpPost("change-password")]
    [ProducesResponseType<AuthenticatedUserResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ChangePassword(ChangePasswordRequest request)
    {
        var user = await userManager.GetUserAsync(User);
        if (user is null || !user.IsActive)
        {
            return Unauthorized();
        }

        var result = await authService.ChangePasswordAsync(
            user,
            request.CurrentPassword,
            request.NewPassword,
            HttpContext.RequestAborted);
        if (!result.Succeeded)
        {
            return BadRequest(new ValidationProblemDetails(ToSafeValidationErrors(result)));
        }

        await signInManager.RefreshSignInAsync(user);
        StoreAntiforgeryToken();
        return Ok(await CreateUserResponseAsync(user));
    }

    [HttpPost("logout")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Logout()
    {
        await signInManager.SignOutAsync();
        HttpContext.User = new ClaimsPrincipal(new ClaimsIdentity());
        StoreAntiforgeryToken();
        return NoContent();
    }

    private UnauthorizedObjectResult AuthenticationFailed() =>
        Unauthorized(new ProblemDetails
        {
            Status = StatusCodes.Status401Unauthorized,
            Title = "Authentication failed",
            Detail = "The username/email or password is incorrect."
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

    private async Task<AuthenticatedUserResponse> CreateUserResponseAsync(ApplicationUser user)
    {
        var roles = await userManager.GetRolesAsync(user);
        if (roles.Count != 1)
        {
            throw new InvalidOperationException("The account must have exactly one role.");
        }

        return new AuthenticatedUserResponse(
            user.Id,
            user.UserName!,
            user.Email!,
            roles[0],
            user.MustChangePassword);
    }

    internal static IDictionary<string, string[]> ToSafeValidationErrors(IdentityResult result)
    {
        var errors = new Dictionary<string, List<string>>(StringComparer.Ordinal);

        foreach (var error in result.Errors)
        {
            var (field, message) = error.Code switch
            {
                "DuplicateEmail" => ("email", "An account with this email already exists."),
                "DuplicateUserName" => ("username", "An account with this username already exists."),
                "InvalidEmail" => ("email", "Enter a valid email address."),
                "InvalidUserName" => ("username", "Use 3–50 letters, numbers, dots, underscores or hyphens."),
                "PasswordMismatch" => ("currentPassword", "The current password is incorrect."),
                "PasswordTooShort" => ("newPassword", "The password must be at least 8 characters."),
                "PasswordRequiresDigit" => ("newPassword", "The password must contain a number."),
                "PasswordRequiresLower" => ("newPassword", "The password must contain a lowercase letter."),
                "PasswordRequiresUpper" => ("newPassword", "The password must contain an uppercase letter."),
                "PasswordRequiresNonAlphanumeric" => ("newPassword", "The password must contain a symbol."),
                _ => ("account", "The account details are not valid.")
            };

            if (!errors.TryGetValue(field, out var messages))
            {
                messages = [];
                errors.Add(field, messages);
            }

            messages.Add(message);
        }

        return errors.ToDictionary(
            pair => pair.Key,
            pair => pair.Value.Distinct(StringComparer.Ordinal).ToArray(),
            StringComparer.Ordinal);
    }
}

public sealed record SignInRequest
{
    [Required, StringLength(256)]
    public required string Identifier { get; init; }

    [Required, StringLength(256, MinimumLength = 1)]
    public required string Password { get; init; }
}

public sealed record ChangePasswordRequest
{
    [Required, StringLength(256, MinimumLength = 1)]
    public required string CurrentPassword { get; init; }

    [Required, StringLength(256, MinimumLength = 8)]
    public required string NewPassword { get; init; }
}

public sealed record SessionResponse(
    AuthenticatedUserResponse? User,
    bool SetupRequired);

public sealed record AuthenticatedUserResponse(
    string Id,
    string Username,
    string Email,
    string Role,
    bool MustChangePassword);
