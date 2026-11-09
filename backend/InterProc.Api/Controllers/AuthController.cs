using System.ComponentModel.DataAnnotations;
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
    UserManager<IdentityUser> userManager,
    SignInManager<IdentityUser> signInManager,
    IAntiforgery antiforgery) : ControllerBase
{
    [HttpPost("signup")]
    [ProducesResponseType<AuthenticatedUserResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SignUp(
        SignUpRequest request,
        CancellationToken cancellationToken)
    {
        var (user, result) = await authService.RegisterAsync(
            request.Email,
            request.Password,
            cancellationToken);

        if (!result.Succeeded)
        {
            return BadRequest(new ValidationProblemDetails(ToSafeValidationErrors(result)));
        }

        await signInManager.SignInAsync(user!, isPersistent: false);
        var response = await CreateUserResponseAsync(user!);
        return CreatedAtAction(nameof(Me), response);
    }

    [HttpPost("login")]
    [ProducesResponseType<AuthenticatedUserResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login(SignInRequest request)
    {
        var result = await signInManager.PasswordSignInAsync(
            request.Email,
            request.Password,
            isPersistent: false,
            lockoutOnFailure: true);

        if (!result.Succeeded)
        {
            return Unauthorized(new ProblemDetails
            {
                Status = StatusCodes.Status401Unauthorized,
                Title = "Authentication failed",
                Detail = "The email or password is incorrect."
            });
        }

        var user = await userManager.FindByEmailAsync(request.Email);
        if (user is null)
        {
            throw new InvalidOperationException("The authenticated account could not be found.");
        }

        return Ok(await CreateUserResponseAsync(user));
    }

    [HttpPost("logout")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Logout()
    {
        await signInManager.SignOutAsync();
        return NoContent();
    }

    [Authorize]
    [HttpGet("me")]
    [ProducesResponseType<AuthenticatedUserResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Me()
    {
        var user = await userManager.GetUserAsync(User);
        if (user is null)
        {
            return Unauthorized();
        }

        return Ok(await CreateUserResponseAsync(user));
    }

    [HttpGet("setup-status")]
    [ProducesResponseType<SetupStatusResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> SetupStatus(CancellationToken cancellationToken)
    {
        var tokens = antiforgery.GetAndStoreTokens(HttpContext);
        Response.Cookies.Append("XSRF-TOKEN", tokens.RequestToken!, new CookieOptions
        {
            HttpOnly = false,
            Secure = true,
            SameSite = SameSiteMode.Lax,
            Path = "/"
        });

        return Ok(new SetupStatusResponse(await authService.HasUsersAsync(cancellationToken)));
    }

    private async Task<AuthenticatedUserResponse> CreateUserResponseAsync(IdentityUser user) =>
        new(user.Id, user.Email!, await userManager.GetRolesAsync(user));

    private static IDictionary<string, string[]> ToSafeValidationErrors(IdentityResult result)
    {
        var errors = new Dictionary<string, List<string>>(StringComparer.Ordinal);

        foreach (var error in result.Errors)
        {
            var (field, message) = error.Code switch
            {
                "DuplicateEmail" or "DuplicateUserName" =>
                    ("email", "An account with this email already exists."),
                "InvalidEmail" =>
                    ("email", "Enter a valid email address."),
                "PasswordTooShort" =>
                    ("password", "The password does not meet the minimum length requirement."),
                "PasswordRequiresDigit" =>
                    ("password", "The password must contain a number."),
                "PasswordRequiresLower" =>
                    ("password", "The password must contain a lowercase letter."),
                "PasswordRequiresUpper" =>
                    ("password", "The password must contain an uppercase letter."),
                "PasswordRequiresNonAlphanumeric" =>
                    ("password", "The password must contain a symbol."),
                _ =>
                    ("account", "The account details are not valid.")
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

/// <summary>Credentials and account details for creating an account.</summary>
public sealed record SignUpRequest
{
    /// <summary>The account email address.</summary>
    [Required, EmailAddress, StringLength(256)]
    public required string Email { get; init; }

    /// <summary>The account password.</summary>
    [Required, StringLength(256, MinimumLength = 1)]
    public required string Password { get; init; }
}

/// <summary>Credentials for signing in to an account.</summary>
public sealed record SignInRequest
{
    /// <summary>The account email address.</summary>
    [Required, EmailAddress, StringLength(256)]
    public required string Email { get; init; }

    /// <summary>The account password.</summary>
    [Required, StringLength(256, MinimumLength = 1)]
    public required string Password { get; init; }
}

/// <summary>Indicates whether the application has any registered users.</summary>
public sealed record SetupStatusResponse(bool HasUsers);

/// <summary>Describes the authenticated account without exposing credentials.</summary>
public sealed record AuthenticatedUserResponse(string Id, string Email, IList<string> Roles);
