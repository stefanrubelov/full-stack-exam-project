namespace server.Features.WeatherStation.Models;

public record SensorTelemetry(
    string SensorId,
    string SensorName,
    string StationId,
    DateTime Timestamp,
    double Temperature,
    double Humidity,
    double Pressure,
    int LightLevel,
    string Status);