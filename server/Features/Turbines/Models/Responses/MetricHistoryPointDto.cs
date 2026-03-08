namespace server.Features.Turbines.Models.Responses;

public record MetricHistoryPointDto(
    string Period,
    double WindSpeed,
    double PowerOutput,
    double RotorSpeed,
    double BladePitch,
    double GeneratorTemp,
    double GearboxTemp,
    double Vibration,
    double AmbientTemperature,
    int DataPoints
);