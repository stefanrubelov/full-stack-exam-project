using Microsoft.EntityFrameworkCore;

namespace server.Entities;

[PrimaryKey(nameof(Id))]
public class WindTurbine
{
    public string Id { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string FarmId { get; set; } = null!;
    public TurbineStatus Status { get; set; } = TurbineStatus.Unknown;
    public DateTime LastSeen { get; set; }
    public int TelemetryIntervalSeconds { get; set; } = 10;
}