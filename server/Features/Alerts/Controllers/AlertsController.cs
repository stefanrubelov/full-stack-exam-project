using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using server.Entities;
using server.Etc;

namespace server.Features.Alerts.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AlertsController(
    MyDbContext db,
    ILogger<AlertsController> logger
) : ControllerBase
{
    [HttpGet]
    public ActionResult<List<TurbineAlert>> GetAll(
        [FromQuery] bool includeAcknowledged = false,
        [FromQuery] int limit = 100)
    {
        var query = db.TurbineAlerts.AsQueryable();
        if (!includeAcknowledged)
            query = query.Where(a => !a.IsAcknowledged);

        var alerts = query
            .OrderByDescending(a => a.Timestamp)
            .Take(Math.Min(limit, 500))
            .ToList();

        return Ok(alerts);
    }

    [HttpPatch("{id}/acknowledge")]
    public async Task<ActionResult<TurbineAlert>> Acknowledge(Guid id)
    {
        var alert = await db.TurbineAlerts.FindAsync(id);
        if (alert == null) throw new NotFoundError("Alert", id);

        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        alert.IsAcknowledged = true;
        alert.AcknowledgedAt = DateTime.UtcNow;
        alert.AcknowledgedByUserId = userId;

        db.TurbineAlerts.Update(alert);
        await db.SaveChangesAsync();

        logger.LogInformation("Alert {AlertId} acknowledged by user {UserId}", id, userId);

        return Ok(alert);
    }
}