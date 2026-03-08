using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace server.Features.Health;

[ApiController]
[Route("api/[controller]")]
public class HealthController(MyDbContext db) : ControllerBase
{
    [HttpGet]
    public IActionResult GetApiHealth()
    {
        return Ok(new { status = "ok", service = "api" });
    }

    [HttpGet("db")]
    public async Task<IActionResult> GetDbHealth()
    {
        var canConnect = await db.Database.CanConnectAsync();
        if (!canConnect)
            return StatusCode(503, new { status = "error", service = "database", message = "Cannot connect to database" });

        return Ok(new { status = "ok", service = "database" });
    }
}
