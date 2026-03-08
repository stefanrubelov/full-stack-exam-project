using Microsoft.EntityFrameworkCore;

namespace server.Entities;

[PrimaryKey(nameof(Id))]
public class WindFarm
{
    public string Id { get; set; } = null!;
    public string Name { get; set; } = null!;
    public ICollection<WindTurbine> Turbines { get; set; } = new List<WindTurbine>();
}

[PrimaryKey(nameof(Id))]
public class WindTurbine
{
    public string Id { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string FarmId { get; set; } = null!;
    public string Status { get; set; } = "unknown";
    public DateTime LastSeen { get; set; }
}