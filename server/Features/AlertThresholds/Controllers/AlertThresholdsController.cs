using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace server.Features.AlertThresholds.Controllers;

[ApiController]
[Route("api/alert-thresholds")]
[Authorize]
public class AlertThresholdsController(MyDbContext db, AlertThresholdCache cache) : ControllerBase
{
    [HttpGet]
    public ActionResult GetAll()
    {
        var thresholds = db.AlertThresholds.OrderBy(t => t.MetricName).ToList();
        return Ok(thresholds);
    }

    [HttpPut("{id:guid}")]
    public ActionResult Update(Guid id, [FromBody] UpdateThresholdRequest request)
    {
        var threshold = db.AlertThresholds.Find(id);
        if (threshold == null) return NotFound(new { error = $"AlertThreshold {id} not found" });

        if (request.Value.HasValue) threshold.Value = request.Value.Value;
        if (request.IsEnabled.HasValue) threshold.IsEnabled = request.IsEnabled.Value;
        if (request.Description != null) threshold.Description = request.Description;

        db.AlertThresholds.Update(threshold);
        db.SaveChanges();
        cache.Invalidate();

        return Ok(threshold);
    }
}

public record UpdateThresholdRequest(double? Value, bool? IsEnabled, string? Description);
