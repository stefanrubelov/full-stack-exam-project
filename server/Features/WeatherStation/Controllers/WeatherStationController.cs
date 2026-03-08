using System.Text.Json;
using Mqtt.Controllers;
using server.Features.WeatherStation.Models;

namespace server.Features.WeatherStation.Controllers;

public class WeatherStationController(ILogger<WeatherStationController> logger) : MqttController
{
    [MqttRoute("station/+/sensor/{sensorId}/telemetry")]
    public async Task HandleTelemetry(string sensorId, SensorTelemetry data)
    {
        logger.LogInformation("Sensor: " + sensorId + ", data: " + JsonSerializer.Serialize(data));
    }
}