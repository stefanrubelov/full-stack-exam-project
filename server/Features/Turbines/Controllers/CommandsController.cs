using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using server.Entities;

namespace server.Features.Turbines.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CommandsController(MyDbContext db) : ControllerBase
{
    [HttpGet]
    public ActionResult GetAll(
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] string? turbineId,
        [FromQuery] string? userName,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        pageSize = Math.Clamp(pageSize, 1, 100);
        page = Math.Max(1, page);

        var fromUtc = from.HasValue ? DateTime.SpecifyKind(from.Value, DateTimeKind.Utc) : (DateTime?)null;
        var toUtc   = to.HasValue   ? DateTime.SpecifyKind(to.Value,   DateTimeKind.Utc) : (DateTime?)null;
        if (toUtc.HasValue && toUtc.Value.TimeOfDay == TimeSpan.Zero)
            toUtc = toUtc.Value.AddDays(1).AddTicks(-1);

        var query = db.TurbineCommands.AsQueryable();

        if (fromUtc.HasValue)
            query = query.Where(c => c.Timestamp >= fromUtc.Value);
        if (toUtc.HasValue)
            query = query.Where(c => c.Timestamp <= toUtc.Value);
        if (!string.IsNullOrWhiteSpace(turbineId))
            query = query.Where(c => c.TurbineId == turbineId);
        if (!string.IsNullOrWhiteSpace(userName))
            query = query.Where(c => c.UserName.ToLower().Contains(userName.ToLower()));

        var total = query.Count();
        var items = query
            .OrderByDescending(c => c.Timestamp)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToList();

        return Ok(new { total, page, pageSize, items });
    }
}
