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
    IWebHostEnvironment env,
    ILogger<AlertsController> logger
) : ControllerBase
{
    private static readonly string[] Severities = ["warning", "critical"];
    private static readonly string[] Messages =
    [
        "High wind speed: 26.4 m/s (threshold: 25 m/s)",
        "Generator overheating: 83.2°C (threshold: 80°C)",
        "Gearbox overheating: 81.7°C (threshold: 80°C)",
        "High vibration: 11.34 (threshold: 10)",
    ];

    [HttpPost("test")]
    public async Task<ActionResult<TurbineAlert>> CreateTestAlert([FromQuery] string turbineId)
    {
        if (!env.IsDevelopment())
            return Forbid();

        var turbine = db.WindTurbines.Find(turbineId);
        if (turbine == null) throw new NotFoundError("Turbine", turbineId);

        var rng      = Random.Shared;
        var message  = Messages[rng.Next(Messages.Length)];
        var severity = message.StartsWith("High wind") ? "critical" : "warning";

        var alert = new TurbineAlert
        {
            Id             = Guid.NewGuid(),
            TurbineId      = turbineId,
            FarmId         = turbine.FarmId,
            Timestamp      = DateTime.UtcNow,
            Severity       = severity,
            Message        = message,
            IsAcknowledged = false,
        };

        db.TurbineAlerts.Add(alert);
        await db.SaveChangesAsync();

        logger.LogInformation("Test alert created for turbine {TurbineId}", turbineId);
        return Ok(alert);
    }


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