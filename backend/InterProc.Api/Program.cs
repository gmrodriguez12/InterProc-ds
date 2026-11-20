
using InterProc.Api.Data;
using InterProc.Api.Domain;
using InterProc.Api.Security;
using InterProc.Api.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace InterProc.Api;

public class Program
{
    public static async Task Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);

        var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException(
                "Connection string 'DefaultConnection' is not configured. Set ConnectionStrings__DefaultConnection or the ConnectionStrings:DefaultConnection environment variable.");
        }

        builder.Services.AddControllersWithViews();
        builder.Services.AddSingleton<IHealthService, HealthService>();
        builder.Services.Configure<ForwardedHeadersOptions>(options =>
        {
            options.ForwardedHeaders = ForwardedHeaders.XForwardedProto;
            options.ForwardLimit = 1;
            options.KnownIPNetworks.Clear();
            options.KnownProxies.Clear();
        });
        builder.Services.AddDbContext<ApplicationDbContext>(options =>
            options.UseNpgsql(connectionString, npgsql => npgsql.EnableRetryOnFailure()));
        builder.Services
            .AddIdentity<ApplicationUser, IdentityRole>(options =>
            {
                options.User.RequireUniqueEmail = true;
                options.SignIn.RequireConfirmedAccount = false;
                options.SignIn.RequireConfirmedEmail = false;
                options.Lockout.AllowedForNewUsers = true;
                options.Lockout.MaxFailedAccessAttempts = 5;
                options.Password.RequiredLength = 8;
            })
            .AddEntityFrameworkStores<ApplicationDbContext>()
            .AddDefaultTokenProviders();
        builder.Services.AddScoped<IUserClaimsPrincipalFactory<ApplicationUser>, ApplicationClaimsPrincipalFactory>();
        builder.Services.AddAuthorizationBuilder()
            .AddPolicy(AppPolicies.ActiveUser, policy =>
                policy.RequireAuthenticatedUser()
                    .RequireClaim("active", "true")
                    .RequireClaim("password_changed", "true"))
            .AddPolicy(AppPolicies.Admin, policy =>
                policy.RequireAuthenticatedUser()
                    .RequireClaim("active", "true")
                    .RequireClaim("password_changed", "true")
                    .RequireRole(AppRoles.Admin));
        var isDevelopment = builder.Environment.IsDevelopment();
        builder.Services.ConfigureApplicationCookie(options =>
        {
            options.Cookie.Name = isDevelopment ? "InterProc.Auth" : "__Host-InterProc.Auth";
            options.Cookie.HttpOnly = true;
            options.Cookie.SecurePolicy = isDevelopment
                ? CookieSecurePolicy.SameAsRequest
                : CookieSecurePolicy.Always;
            options.Cookie.SameSite = SameSiteMode.Lax;
            options.Cookie.Path = "/";
            options.SlidingExpiration = true;
            options.Events.OnRedirectToLogin = context =>
            {
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                return Task.CompletedTask;
            };
            options.Events.OnRedirectToAccessDenied = context =>
            {
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                return Task.CompletedTask;
            };
            options.Events.OnValidatePrincipal = async context =>
            {
                var userManager = context.HttpContext.RequestServices
                    .GetRequiredService<UserManager<ApplicationUser>>();
                var user = await userManager.GetUserAsync(context.Principal!);
                if (user is null || !user.IsActive)
                {
                    context.RejectPrincipal();
                    await context.HttpContext.SignOutAsync(IdentityConstants.ApplicationScheme);
                }
            };
        });
        builder.Services.AddAntiforgery(options =>
        {
            options.HeaderName = "X-XSRF-TOKEN";
            options.Cookie.Name = isDevelopment
                ? "InterProc.Antiforgery"
                : "__Host-InterProc.Antiforgery";
            options.Cookie.HttpOnly = true;
            options.Cookie.SecurePolicy = isDevelopment
                ? CookieSecurePolicy.SameAsRequest
                : CookieSecurePolicy.Always;
            options.Cookie.SameSite = SameSiteMode.Lax;
            options.Cookie.Path = "/";
        });
        var dataProtectionKeysPath = builder.Configuration["DataProtection:KeysPath"];
        if (!string.IsNullOrWhiteSpace(dataProtectionKeysPath))
        {
            builder.Services
                .AddDataProtection()
                .PersistKeysToFileSystem(new DirectoryInfo(dataProtectionKeysPath))
                .SetApplicationName("InterProc");
        }
        builder.Services.AddScoped<IAuthService, AuthService>();
        builder.Services.AddScoped<BootstrapService>();
        builder.Services.AddScoped<AuditService>();

        if (builder.Environment.IsDevelopment())
        {
            builder.Services.AddOpenApi();
        }

        var app = builder.Build();

        app.UseForwardedHeaders();

        await using (var scope = app.Services.CreateAsyncScope())
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            await dbContext.Database.MigrateAsync();

            if (args.Contains("bootstrap-admin", StringComparer.Ordinal))
            {
                var bootstrap = scope.ServiceProvider.GetRequiredService<BootstrapService>();
                await bootstrap.BootstrapAdminAsync(
                    RequiredEnvironment("INTERPROC_ADMIN_DISPLAY_NAME"),
                    RequiredEnvironment("INTERPROC_ADMIN_USERNAME"),
                    RequiredEnvironment("INTERPROC_ADMIN_EMAIL"),
                    RequiredEnvironment("INTERPROC_ADMIN_PASSWORD"),
                    CancellationToken.None);
                return;
            }
        }

        if (app.Environment.IsDevelopment())
        {
            app.MapOpenApi();
        }

        app.UseAuthentication();
        app.UseAuthorization();
        app.MapControllers();
        app.Run();
    }

    private static string RequiredEnvironment(string name) =>
        Environment.GetEnvironmentVariable(name) is { Length: > 0 } value
            ? value
            : throw new InvalidOperationException($"Environment variable '{name}' is required.");
}
