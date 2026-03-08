using Mqtt.Controllers;
using server.Entities;
using server.Features.WindFarm.Models;

namespace server.Features.WindFarm.Controllers;

public class WindFarmMqttController(
    MyDbContext db,
    ILogger<WindFarmMqttController> logger) : MqttController
{
    [MqttRoute("farm/+/windmill/{turbineId}/telemetry")]
    public async Task HandleTelemetry(string turbineId, TurbineTelemetry telemetry)
    {
        logger.LogInformation("Telemetry received for turbine {TurbineId} in farm {FarmId}", turbineId, telemetry.FarmId);

        var farm = await db.WindFarms.FindAsync(telemetry.FarmId);
        if (farm == null)
        {
            farm = new server.Entities.WindFarm { Id = telemetry.FarmId, Name = "Offshore Wind Farm" };
            db.WindFarms.Add(farm);
        }

        var turbine = await db.WindTurbines.FindAsync(telemetry.TurbineId);
        if (turbine == null)
        {
            turbine = new WindTurbine
            {
                Id = telemetry.TurbineId,
                Name = telemetry.TurbineName,
                FarmId = telemetry.FarmId,
                Status = telemetry.Status,
                LastSeen = telemetry.Timestamp.ToUniversalTime()
            };
            db.WindTurbines.Add(turbine);
        }
        else
        {
            turbine.Status = telemetry.Status;
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
        if (telemetry.WindSpeed > 25)
            AddAlert(telemetry, "critical", $"High wind speed: {telemetry.WindSpeed:F1} m/s (threshold: 25 m/s)");

        if (telemetry.Vibration > 10)
            AddAlert(telemetry, "warning", $"High vibration: {telemetry.Vibration:F2} (threshold: 10)");

        if (telemetry.GeneratorTemp > 80)
            AddAlert(telemetry, "warning", $"Generator overheating: {telemetry.GeneratorTemp:F1}°C (threshold: 80°C)");

        if (telemetry.GearboxTemp > 80)
            AddAlert(telemetry, "warning", $"Gearbox overheating: {telemetry.GearboxTemp:F1}°C (threshold: 80°C)");
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