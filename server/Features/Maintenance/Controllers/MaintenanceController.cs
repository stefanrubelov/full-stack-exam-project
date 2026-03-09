using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace server.Features.Maintenance.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MaintenanceController(MyDbContext db) : ControllerBase
{
    [HttpGet]
    public ActionResult GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? turbineId = null)
    {
        pageSize = Math.Clamp(pageSize, 1, 100);
        page = Math.Max(1, page);

        var commandsQuery = db.TurbineCommands.AsQueryable();

        if (!string.IsNullOrWhiteSpace(turbineId))
            commandsQuery = commandsQuery.Where(c => c.TurbineId == turbineId);

        // Load all stop and start commands for the relevant turbines
        var allCommands = commandsQuery
            .Where(c => c.Action == "Stop" || c.Action == "Start")
            .OrderBy(c => c.TurbineId)
            .ThenBy(c => c.Timestamp)
            .ToList();

        var turbines = db.WindTurbines.ToList();
        var turbineMap = turbines.ToDictionary(t => t.Id, t => t.Name);

        // Find maintenance stops (Action == "Stop" with "maintenance" in Payload)
        var maintenanceStops = allCommands
            .Where(c => c.Action == "Stop" &&
                        c.Payload != null &&
                        c.Payload.Contains("maintenance", StringComparison.OrdinalIgnoreCase))
            .ToList();

        var records = maintenanceStops.Select(stop =>
        {
            // Find the next start command for the same turbine after the stop
            var resume = allCommands
                .FirstOrDefault(c => c.Action == "Start" &&
                                     c.TurbineId == stop.TurbineId &&
                                     c.Timestamp > stop.Timestamp);

            double? durationMinutes = resume != null
                ? (resume.Timestamp - stop.Timestamp).TotalMinutes
                : null;

            return new
            {
                turbineId = stop.TurbineId,
                turbineName = turbineMap.TryGetValue(stop.TurbineId, out var name) ? name : stop.TurbineId,
                startedAt = stop.Timestamp,
                endedAt = resume?.Timestamp,
                durationMinutes,
                triggeredBy = stop.UserName,
                resumedBy = resume?.UserName
            };
        }).ToList();

        var total = records.Count;
        var items = records
            .OrderByDescending(r => r.startedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToList();

        return Ok(new { total, page, pageSize, items });
    }
}
