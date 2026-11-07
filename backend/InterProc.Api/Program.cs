
using InterProc.Api.Services;

namespace InterProc.Api;

public class Program
{
    public static void Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);

        builder.Services.AddControllers();
        builder.Services.AddSingleton<IHealthService, HealthService>();

        if (builder.Environment.IsDevelopment())
        {
            builder.Services.AddOpenApi();
        }

        var app = builder.Build();

        if (app.Environment.IsDevelopment())
        {
            app.MapOpenApi();
        }

        app.MapControllers();
        app.Run();
    }
}
