namespace InterProc.Api.Services;

public sealed class HealthService(IConfiguration configuration) : IHealthService
{
    public string GetStatus() => "Healthy";

    public string GetEnvironment() =>
        configuration["ApiSettings:Environment"] ?? Environments.Production;
}
