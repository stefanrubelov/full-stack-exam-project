using System.Text.Json.Serialization;

namespace server.Features.Turbines.Models.Requests;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum TurbineAction
{
    Start,
    Stop,
    SetPitch,
    SetInterval,
}
