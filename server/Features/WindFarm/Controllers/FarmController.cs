using Microsoft.AspNetCore.Mvc;

namespace server.Features.WindFarm.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FarmController(ConnectionStrings connectionStrings) : ControllerBase
{
    [HttpGet]
    public IActionResult Get()
    {
        return Ok(new { farmId = connectionStrings.FarmId });
    }
}
