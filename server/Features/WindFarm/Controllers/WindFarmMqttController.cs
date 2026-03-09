using Mqtt.Controllers;
using server.Entities;
using server.Features.AlertThresholds;
using server.Features.WindFarm.Models;
using TurbineStatus = server.Entities.TurbineStatus;

namespace server.Features.WindFarm.Controllers;

public class WindFarmMqttController(
    MyDbContext db,
    ConnectionStrings connectionStrings,
    AlertThresholdCache thresholdCache,
    ILogger<WindFarmMqttController> logger) : MqttController
{
    [MqttRoute("farm/+/windmill/{turbineId}/telemetry")]
    public async Task HandleTelemetry(string turbineId, TurbineTelemetry telemetry)
    {
        if (!string.IsNullOrWhiteSpace(connectionStrings.FarmId) &&
            !string.Equals(telemetry.FarmId, connectionStrings.FarmId, StringComparison.OrdinalIgnoreCase))
        {
            logger.LogDebug("Ignoring telemetry from foreign farm {FarmId}", telemetry.FarmId);
            return;
        }

        logger.LogInformation("Telemetry received for turbine {TurbineId} in farm {FarmId}", turbineId, telemetry.FarmId);

        var turbine = await db.WindTurbines.FindAsync(telemetry.TurbineId);
        if (turbine == null)
        {
            turbine = new WindTurbine
            {
                Id = telemetry.TurbineId,
                Name = telemetry.TurbineName,
                FarmId = telemetry.FarmId,
                Status = Enum.TryParse<TurbineStatus>(telemetry.Status, ignoreCase: true, out var s) ? s : TurbineStatus.Unknown,
                LastSeen = telemetry.Timestamp.ToUniversalTime()
            };
            db.WindTurbines.Add(turbine);
        }
        else
        {
            // Status is owned by commands (stop/start) — only LastSeen is updated from telemetry
            turbine.LastSeen = telemetry.Timestamp.ToUniversalTime();
            db.WindTurbines.Update(turbine);
        }

        db.TurbineMetrics.Add(new TurbineMetric
        {
            Id = Guid.NewGuid(),
            TurbineId = telemetry.TurbineId,
            FarmId = telemetry.FarmId,
            Timestamp = telemetry.Timestamp.ToUniversalTime(),
            WindSpeed = telemetry.WindSpeed,
            WindDirection = telemetry.WindDirection,
            AmbientTemperature = telemetry.AmbientTemperature,
            RotorSpeed = telemetry.RotorSpeed,
            PowerOutput = telemetry.PowerOutput,
            NacelleDirection = telemetry.NacelleDirection,
            BladePitch = telemetry.BladePitch,
            GeneratorTemp = telemetry.GeneratorTemp,
            GearboxTemp = telemetry.GearboxTemp,
            Vibration = telemetry.Vibration,
            Status = telemetry.Status
        });

        GenerateThresholdAlerts(telemetry);

        await db.SaveChangesAsync();
    }

    [MqttRoute("farm/+/windmill/{turbineId}/alert")]
    public async Task HandleAlert(string turbineId, TurbineAlertPayload alertPayload)
    {
        if (!string.IsNullOrWhiteSpace(connectionStrings.FarmId) &&
            !string.Equals(alertPayload.FarmId, connectionStrings.FarmId, StringComparison.OrdinalIgnoreCase))
        {
            logger.LogDebug("Ignoring alert from foreign farm {FarmId}", alertPayload.FarmId);
            return;
        }

        logger.LogWarning("Alert from turbine {TurbineId}: [{Severity}] {Message}", turbineId, alertPayload.Severity, alertPayload.Message);

        db.TurbineAlerts.Add(new TurbineAlert
        {
            Id = Guid.NewGuid(),
            TurbineId = alertPayload.TurbineId,
            FarmId = alertPayload.FarmId,
            Timestamp = alertPayload.Timestamp.ToUniversalTime(),
            Severity = alertPayload.Severity,
            Message = alertPayload.Message,
            IsAcknowledged = false
        });

        await db.SaveChangesAsync();
    }

    private void GenerateThresholdAlerts(TurbineTelemetry telemetry)
    {
        var thresholds = thresholdCache.GetEnabled(db);

        var metricValues = new Dictionary<string, double>(StringComparer.OrdinalIgnoreCase)
        {
            { "windSpeed", telemetry.WindSpeed },
            { "vibration", telemetry.Vibration },
            { "generatorTemp", telemetry.GeneratorTemp },
            { "gearboxTemp", telemetry.GearboxTemp }
        };

        foreach (var threshold in thresholds)
        {
            if (!metricValues.TryGetValue(threshold.MetricName, out var metricValue)) continue;
            if (metricValue > threshold.Value)
                AddAlert(telemetry, threshold.Severity, $"{threshold.Description}: {metricValue:F2} (threshold: {threshold.Value})");
        }
    }

    private void AddAlert(TurbineTelemetry telemetry, string severity, string message)
    {
        db.TurbineAlerts.Add(new TurbineAlert
        {
            Id = Guid.NewGuid(),
            TurbineId = telemetry.TurbineId,
            FarmId = telemetry.FarmId,
            Timestamp = DateTime.UtcNow,
            Severity = severity,
            Message = message,
            IsAcknowledged = false
        });
    }
}