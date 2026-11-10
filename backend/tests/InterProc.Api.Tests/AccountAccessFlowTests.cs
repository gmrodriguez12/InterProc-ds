using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using InterProc.Api;
using InterProc.Api.Services;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Testcontainers.PostgreSql;
using Xunit;

namespace InterProc.Api.Tests;

public sealed class AccountAccessFlowTests : IAsyncLifetime
{
    private readonly PostgreSqlContainer database = new PostgreSqlBuilder("postgres:18-alpine")
        .WithDatabase("interproc_tests")
        .WithUsername("interproc")
        .WithPassword("Test-only-db-password-42!")
        .Build();

    private TestApplication? application;

    [Fact]
    public async Task Internal_account_lifecycle_is_protected_end_to_end()
    {
        var app = application ?? throw new InvalidOperationException("Test application is not initialized.");

        using var adminClient = app.CreateClient(ClientOptions());
        using (var emptySession = await GetSessionAsync(adminClient))
        {
            Assert.True(emptySession.RootElement.GetProperty("setupRequired").GetBoolean());
            Assert.Equal(JsonValueKind.Null, emptySession.RootElement.GetProperty("user").ValueKind);
        }

        await using (var scope = app.Services.CreateAsyncScope())
        {
            var bootstrap = scope.ServiceProvider.GetRequiredService<AdminBootstrapService>();
            await bootstrap.RunAsync(CancellationToken.None);
            await bootstrap.RunAsync(CancellationToken.None);
        }

        using var noCsrfClient = app.CreateClient(ClientOptions());
        var missingCsrf = await noCsrfClient.PostAsJsonAsync("/api/auth/login", new
        {
            identifier = "bootstrap.admin",
            password = "Temporary-Admin-42!"
        });
        Assert.Equal(HttpStatusCode.BadRequest, missingCsrf.StatusCode);

        var removedSignup = await noCsrfClient.PostAsJsonAsync("/api/auth/signup", new { });
        Assert.Equal(HttpStatusCode.NotFound, removedSignup.StatusCode);

        using (var anonymousSession = await GetSessionAsync(adminClient))
        {
            Assert.False(anonymousSession.RootElement.GetProperty("setupRequired").GetBoolean());
            Assert.Equal(JsonValueKind.Null, anonymousSession.RootElement.GetProperty("user").ValueKind);
        }

        var adminLogin = await adminClient.PostAsJsonAsync("/api/auth/login", new
        {
            identifier = "bootstrap.admin",
            password = "Temporary-Admin-42!"
        });
        Assert.Equal(HttpStatusCode.OK, adminLogin.StatusCode);
        CaptureXsrf(adminClient, adminLogin);

        var blockedUntilPasswordChange = await adminClient.GetAsync("/api/accounts");
        Assert.Equal(HttpStatusCode.Forbidden, blockedUntilPasswordChange.StatusCode);

        var passwordChange = await adminClient.PostAsJsonAsync("/api/auth/change-password", new
        {
            currentPassword = "Temporary-Admin-42!",
            newPassword = "Permanent-Admin-84!"
        });
        passwordChange.EnsureSuccessStatusCode();
        CaptureXsrf(adminClient, passwordChange);

        var duplicateRequests = new[]
        {
            adminClient.PostAsJsonAsync("/api/accounts", NewAccount("operator.one", "operator.one@example.test", "usuario")),
            adminClient.PostAsJsonAsync("/api/accounts", NewAccount("operator.one", "operator.one@example.test", "usuario"))
        };
        var duplicateResponses = await Task.WhenAll(duplicateRequests);
        Assert.Single(duplicateResponses, response => response.StatusCode == HttpStatusCode.Created);
        Assert.Single(duplicateResponses, response => response.StatusCode == HttpStatusCode.BadRequest);

        var createdUserResponse = duplicateResponses.Single(
            response => response.StatusCode == HttpStatusCode.Created);
        using var createdUser = await JsonDocument.ParseAsync(
            await createdUserResponse.Content.ReadAsStreamAsync());
        var userId = createdUser.RootElement.GetProperty("id").GetString()
            ?? throw new InvalidOperationException("Created user id is missing.");

        var lockoutUser = await adminClient.PostAsJsonAsync(
            "/api/accounts",
            NewAccount("lockout.user", "lockout.user@example.test", "usuario"));
        lockoutUser.EnsureSuccessStatusCode();

        using (var lockoutClient = app.CreateClient(ClientOptions()))
        {
            using var lockoutSession = await GetSessionAsync(lockoutClient);
            for (var attempt = 0; attempt < 5; attempt++)
            {
                var rejected = await lockoutClient.PostAsJsonAsync("/api/auth/login", new
                {
                    identifier = "lockout.user",
                    password = "Definitely-Wrong-42!"
                });
                Assert.Equal(HttpStatusCode.Unauthorized, rejected.StatusCode);
            }

            var lockedOut = await lockoutClient.PostAsJsonAsync("/api/auth/login", new
            {
                identifier = "lockout.user",
                password = "Temporary-User-42!"
            });
            Assert.Equal(HttpStatusCode.Unauthorized, lockedOut.StatusCode);
        }

        using var userClient = app.CreateClient(ClientOptions());
        await GetSessionAsync(userClient);
        var emailLogin = await userClient.PostAsJsonAsync("/api/auth/login", new
        {
            identifier = "operator.one@example.test",
            password = "Temporary-User-42!"
        });
        emailLogin.EnsureSuccessStatusCode();
        CaptureXsrf(userClient, emailLogin);

        var userPasswordChange = await userClient.PostAsJsonAsync("/api/auth/change-password", new
        {
            currentPassword = "Temporary-User-42!",
            newPassword = "Permanent-User-84!"
        });
        userPasswordChange.EnsureSuccessStatusCode();
        CaptureXsrf(userClient, userPasswordChange);

        var forbiddenAccounts = await userClient.GetAsync("/api/accounts");
        Assert.Equal(HttpStatusCode.Forbidden, forbiddenAccounts.StatusCode);

        var deactivate = await adminClient.PatchAsJsonAsync($"/api/accounts/{userId}/active", new
        {
            isActive = false
        });
        deactivate.EnsureSuccessStatusCode();

        var disabledSession = await userClient.GetAsync("/api/auth/session");
        disabledSession.EnsureSuccessStatusCode();
        using var disabledSessionJson = await JsonDocument.ParseAsync(
            await disabledSession.Content.ReadAsStreamAsync());
        Assert.Equal(JsonValueKind.Null, disabledSessionJson.RootElement.GetProperty("user").ValueKind);

        var selfDeactivation = await adminClient.PatchAsJsonAsync(
            "/api/accounts/" + GetUserId(passwordChange) + "/active",
            new { isActive = false });
        Assert.Equal(HttpStatusCode.BadRequest, selfDeactivation.StatusCode);
    }

    public async Task InitializeAsync()
    {
        await database.StartAsync();
        Environment.SetEnvironmentVariable(
            "ConnectionStrings__DefaultConnection",
            database.GetConnectionString());
        Environment.SetEnvironmentVariable("BootstrapAdmin__Username", "bootstrap.admin");
        Environment.SetEnvironmentVariable("BootstrapAdmin__Email", "bootstrap.admin@example.test");
        Environment.SetEnvironmentVariable("BootstrapAdmin__Password", "Temporary-Admin-42!");
        application = new TestApplication(database.GetConnectionString());
        _ = application.Services;
    }

    public async Task DisposeAsync()
    {
        if (application is not null)
        {
            await application.DisposeAsync();
        }

        Environment.SetEnvironmentVariable("ConnectionStrings__DefaultConnection", null);
        Environment.SetEnvironmentVariable("BootstrapAdmin__Username", null);
        Environment.SetEnvironmentVariable("BootstrapAdmin__Email", null);
        Environment.SetEnvironmentVariable("BootstrapAdmin__Password", null);
        await database.DisposeAsync();
    }

    private static object NewAccount(string username, string email, string role) => new
    {
        username,
        email,
        temporaryPassword = "Temporary-User-42!",
        role
    };

    private static WebApplicationFactoryClientOptions ClientOptions() => new()
    {
        AllowAutoRedirect = false,
        HandleCookies = true
    };

    private static async Task<JsonDocument> GetSessionAsync(HttpClient client)
    {
        var response = await client.GetAsync("/api/auth/session");
        response.EnsureSuccessStatusCode();
        CaptureXsrf(client, response);
        return await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync());
    }

    private static void CaptureXsrf(HttpClient client, HttpResponseMessage response)
    {
        var token = response.Headers.GetValues("Set-Cookie")
            .Select(value => value.Split(';', 2)[0])
            .Where(value => value.StartsWith("XSRF-TOKEN=", StringComparison.Ordinal))
            .Select(value => Uri.UnescapeDataString(value["XSRF-TOKEN=".Length..]))
            .Single();

        client.DefaultRequestHeaders.Remove("X-XSRF-TOKEN");
        client.DefaultRequestHeaders.Add("X-XSRF-TOKEN", token);
    }

    private static string GetUserId(HttpResponseMessage response)
    {
        using var document = JsonDocument.Parse(response.Content.ReadAsStringAsync().GetAwaiter().GetResult());
        return document.RootElement.GetProperty("id").GetString()
            ?? throw new InvalidOperationException("Authenticated user id is missing.");
    }

    private sealed class TestApplication(string connectionString) : WebApplicationFactory<Program>
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Development");
            builder.UseSetting("ConnectionStrings:DefaultConnection", connectionString);
        }
    }
}
