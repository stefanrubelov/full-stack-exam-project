using Microsoft.EntityFrameworkCore;
using server.Entities;

namespace server;

public class MyDbContext : DbContext
{
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema("iot_weatherstation");

        modelBuilder.Entity<Entities.WindTurbine>()
            .Property(t => t.Status)
            .HasConversion(
                v => v.ToString().ToLower(),
                v => v == "running" ? Entities.TurbineStatus.Running
                   : v == "stopped" ? Entities.TurbineStatus.Stopped
                   : Entities.TurbineStatus.Unknown);
    }

    public MyDbContext(DbContextOptions<MyDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<Station> Stations { get; set; }
    public DbSet<Measurement> Measurements { get; set; }

    // Wind turbine entities
    public DbSet<WindTurbine> WindTurbines { get; set; }
    public DbSet<TurbineMetric> TurbineMetrics { get; set; }
    public DbSet<TurbineAlert> TurbineAlerts { get; set; }
    public DbSet<TurbineCommand> TurbineCommands { get; set; }
    public DbSet<AlertThreshold> AlertThresholds { get; set; }
}

[PrimaryKey(nameof(Id))]
public class Station
{
    public string Id { get; set; }
    public string Name { get; set; }
    public string CreatedBy { get; set; }
}

[PrimaryKey(nameof(Id))]
public class Measurement
{
    public Guid Id { get; set; }
    public string StationId { get; set; }
    public string SensorId { get; set; }
    public DateTime Timestamp { get; set; }
    public double Temperature { get; set; }
    public double Humidity { get; set; }
    public double Pressure { get; set; }
    public int LightLevel { get; set; }
}