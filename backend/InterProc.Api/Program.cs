
using InterProc.Api.Data;
using InterProc.Api.Services;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.DataProtection;
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
        builder.Services.AddDbContext<ApplicationDbContext>(options =>
            options.UseNpgsql(connectionString, npgsql => npgsql.EnableRetryOnFailure()));
        builder.Services
            .AddIdentity<IdentityUser, IdentityRole>(options =>
            {
                options.User.RequireUniqueEmail = true;
                options.SignIn.RequireConfirmedAccount = false;
                options.SignIn.RequireConfirmedEmail = false;
            })
            .AddEntityFrameworkStores<ApplicationDbContext>()
            .AddDefaultTokenProviders();
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

        if (builder.Environment.IsDevelopment())
        {
            builder.Services.AddOpenApi();
        }

        var app = builder.Build();

        await using (var scope = app.Services.CreateAsyncScope())
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            await dbContext.Database.MigrateAsync();
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
}
