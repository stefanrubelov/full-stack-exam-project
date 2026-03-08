using System.Globalization;
using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Mqtt.Controllers;
using server.Entities;
using server.Etc;
using server.Features.Turbines.Models.Requests;
using server.Features.Turbines.Models.Responses;

namespace server.Features.Turbines.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TurbinesController(
    MyDbContext db,
    IMqttClientService mqttClient,
    ILogger<TurbinesController> logger
) : ControllerBase
{
    [HttpGet]
    public ActionResult<List<TurbineStatusDto>> GetAll()
    {
        var turbines = db.WindTurbines.OrderBy(t => t.Name).ToList();
        var result = turbines.Select(t =>
        {
            var latest = db.TurbineMetrics
                .Where(m => m.TurbineId == t.Id)
                .OrderByDescending(m => m.Timestamp)
                .FirstOrDefault();
            return new TurbineStatusDto(t, latest);
        }).ToList();
        return Ok(result);
    }

    [HttpGet("{id}")]
    public ActionResult<TurbineStatusDto> GetById(string id)
    {
        var turbine = db.WindTurbines.Find(id);
        if (turbine == null) throw new NotFoundError("Turbine", id);

        var latest = db.TurbineMetrics
            .Where(m => m.TurbineId == id)
            .OrderByDescending(m => m.Timestamp)
            .FirstOrDefault();

        return Ok(new TurbineStatusDto(turbine, latest));
    }

    [HttpGet("{id}/metrics")]
    public ActionResult<List<TurbineMetric>> GetMetrics(string id, [FromQuery] int limit = 50)
    {
        var metrics = db.TurbineMetrics
            .Where(m => m.TurbineId == id)
            .OrderByDescending(m => m.Timestamp)
            .Take(Math.Min(limit, 200))
            .ToList();
        return Ok(metrics);
    }

    [HttpGet("{id}/metrics/history")]
    public ActionResult<List<MetricHistoryPointDto>> GetMetricsHistory(
        string id,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] string granularity = "day")
    {
        var fromUtc = from.HasValue
            ? DateTime.SpecifyKind(from.Value, DateTimeKind.Utc)
            : DateTime.UtcNow.AddDays(-30);
        var toUtc = to.HasValue
            ? DateTime.SpecifyKind(to.Value, DateTimeKind.Utc)
            : DateTime.UtcNow;

        var metrics = db.TurbineMetrics
            .Where(m => m.TurbineId == id && m.Timestamp >= fromUtc && m.Timestamp <= toUtc)
            .OrderBy(m => m.Timestamp)
            .ToList();

        var result = metrics
            .GroupBy(m => GetPeriodKey(m.Timestamp, granularity))
            .OrderBy(g => g.Key)
            .Select(g => new MetricHistoryPointDto(
                Period: g.Key,
                WindSpeed: g.Average(m => m.WindSpeed),
                PowerOutput: g.Average(m => m.PowerOutput),
                RotorSpeed: g.Average(m => m.RotorSpeed),
                BladePitch: g.Average(m => m.BladePitch),
                GeneratorTemp: g.Average(m => m.GeneratorTemp),
                GearboxTemp: g.Average(m => m.GearboxTemp),
                Vibration: g.Average(m => m.Vibration),
                AmbientTemperature: g.Average(m => m.AmbientTemperature),
                DataPoints: g.Count()
            ))
            .ToList();

        return Ok(result);
    }

    private static string GetPeriodKey(DateTime ts, string granularity) => granularity switch
    {
        "week"    => $"{ts.Year}-W{ISOWeek.GetWeekOfYear(ts):D2}",
        "month"   => ts.ToString("yyyy-MM"),
        "quarter" => $"{ts.Year}-Q{(ts.Month - 1) / 3 + 1}",
        "year"    => ts.Year.ToString(),
        _         => ts.ToString("yyyy-MM-dd"),
    };

    [HttpGet("{id}/commands")]
    public ActionResult<List<TurbineCommand>> GetCommands(string id)
    {
        var commands = db.TurbineCommands
            .Where(c => c.TurbineId == id)
            .OrderByDescending(c => c.Timestamp)
            .Take(50)
            .ToList();
        return Ok(commands);
    }

    [HttpPost("{id}/commands")]
    public async Task<ActionResult<TurbineCommand>> SendCommand(string id, [FromBody] SendCommandRequest request)
    {
        var turbine = db.WindTurbines.Find(id);
        if (turbine == null) throw new NotFoundError("Turbine", id);

        if (!IsValidAction(request.Action))
            return BadRequest(new { error = $"Unknown action '{request.Action}'. Valid: setInterval, stop, start, setPitch" });

        if (request.Action == "setInterval" && (request.Value == null || request.Value < 1 || request.Value > 60))
            return BadRequest(new { error = "setInterval requires 'value' between 1 and 60" });

        if (request.Action == "setPitch" && (request.Angle == null || request.Angle < 0 || request.Angle > 30))
            return BadRequest(new { error = "setPitch requires 'angle' between 0 and 30 degrees" });

        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var userName = User.FindFirst(ClaimTypes.Name)!.Value;

        var mqttPayload = BuildMqttPayload(request);
        var payloadJson = JsonSerializer.Serialize(mqttPayload);
        var topic = $"farm/{turbine.FarmId}/windmill/{turbine.Id}/command";

        await mqttClient.PublishAsync(topic, payloadJson);

        if (request.Action is "stop" or "start")
        {
            turbine.Status = request.Action == "stop" ? "stopped" : "running";
            turbine.LastSeen = DateTime.UtcNow;
            db.WindTurbines.Update(turbine);
        }

        var cmd = new TurbineCommand
        {
            Id = Guid.NewGuid(),
            TurbineId = id,
            FarmId = turbine.FarmId,
            UserId = userId,
            UserName = userName,
            Action = request.Action,
            Payload = payloadJson,
            Timestamp = DateTime.UtcNow
        };
        db.TurbineCommands.Add(cmd);
        await db.SaveChangesAsync();

        logger.LogInformation("Command '{Action}' sent to turbine {TurbineId} by {UserName}", request.Action, id, userName);

        return Ok(cmd);
    }

    private static bool IsValidAction(string action) =>
        action is "setInterval" or "stop" or "start" or "setPitch";

    private static object BuildMqttPayload(SendCommandRequest r) => r.Action switch
    {
        "setInterval" => new { action = "setInterval", value = r.Value },
        "stop" => new { action = "stop", reason = r.Reason ?? "" },
        "start" => new { action = "start" },
        "setPitch" => new { action = "setPitch", angle = r.Angle },
        _ => new { action = r.Action }
    };
}
