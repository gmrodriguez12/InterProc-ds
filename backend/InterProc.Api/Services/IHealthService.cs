namespace InterProc.Api.Services;

public interface IHealthService
{
    string GetStatus();
    string GetEnvironment();
}
