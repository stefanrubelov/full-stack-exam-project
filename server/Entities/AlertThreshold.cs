using Microsoft.EntityFrameworkCore;

namespace server.Entities;

[PrimaryKey(nameof(Id))]
public class AlertThreshold
{
    public Guid Id { get; set; }
    public string MetricName { get; set; } = null!;
    public double Value { get; set; }
    public string Severity { get; set; } = null!;
    public string Description { get; set; } = null!;
    public bool IsEnabled { get; set; } = true;
}
