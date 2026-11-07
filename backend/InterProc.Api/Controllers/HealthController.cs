using InterProc.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace InterProc.Api.Controllers;

[ApiController]
[Route("api")]
public sealed class HealthController(IHealthService healthService) : ControllerBase
{
    [HttpGet("health")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult Get()
    {
        return Ok(new
        {
            status = healthService.GetStatus(),
            environment = healthService.GetEnvironment(),
            timestamp = DateTimeOffset.UtcNow
        });
    }
}
