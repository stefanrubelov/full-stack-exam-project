using Microsoft.EntityFrameworkCore;

namespace server.Entities;

[PrimaryKey(nameof(Id))]
public class TurbineCommand
{
    public Guid Id { get; set; }
    public string TurbineId { get; set; } = null!;
    public string FarmId { get; set; } = null!;
    public Guid UserId { get; set; }
    public string UserName { get; set; } = null!;
    public string Action { get; set; } = null!;
    public string? Payload { get; set; }
    public DateTime Timestamp { get; set; }
}