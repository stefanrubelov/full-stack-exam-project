namespace server.Features.WindFarm.Models;

public record TurbineAlertPayload(
    string TurbineId,
    string FarmId,
    DateTime Timestamp,
    string Severity,
    string Message);