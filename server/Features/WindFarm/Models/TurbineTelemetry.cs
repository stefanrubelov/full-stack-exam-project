namespace server.Features.WindFarm.Models;

public record TurbineTelemetry(
    string TurbineId,
    string TurbineName,
    string FarmId,
    DateTime Timestamp,
    double WindSpeed,
    double WindDirection,
    double AmbientTemperature,
    double RotorSpeed,
    double PowerOutput,
    double NacelleDirection,
    double BladePitch,
    double GeneratorTemp,
    double GearboxTemp,
    double Vibration,
    string Status);