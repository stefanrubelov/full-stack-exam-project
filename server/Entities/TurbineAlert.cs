using Microsoft.EntityFrameworkCore;

namespace server.Entities;

[PrimaryKey(nameof(Id))]
public class TurbineAlert
{
    public Guid Id { get; set; }
    public string TurbineId { get; set; } = null!;
    public string FarmId { get; set; } = null!;
    public DateTime Timestamp { get; set; }
    public string Severity { get; set; } = null!;
    public string Message { get; set; } = null!;
    public bool IsAcknowledged { get; set; }
    public DateTime? AcknowledgedAt { get; set; }
    public Guid? AcknowledgedByUserId { get; set; }
}