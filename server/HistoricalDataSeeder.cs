using server.Entities;
using TurbineStatus = server.Entities.TurbineStatus;

namespace server;

/// <summary>
/// Seeds ~1.5 years of realistic historical turbine metrics. Development only.
/// Skips if historical data (older than 7 days) already exists.
/// </summary>
public class HistoricalDataSeeder(MyDbContext ctx, ILogger<HistoricalDataSeeder> logger)
{
    // Turbine specs (generic 2 MW offshore turbine)
    private const double RatedPowerW  = 2_000_000;
    private const double CutInSpeed   = 3.0;
    private const double RatedSpeed   = 12.0;
    private const double CutOutSpeed  = 25.0;

    private const int    BatchSize     = 1_000;
    private static readonly TimeSpan   Interval      = TimeSpan.FromMinutes(30);
    private static readonly TimeSpan   HistoryLength = TimeSpan.FromDays(548); // ~1.5 years

    // Fixed dev IDs so the seeded turbines are stable across restarts
    private const string DevFarmId = "aaaaaaaa-0000-0000-0000-000000000001";
    private static readonly (string Id, string Name)[] DevTurbineDefs =
    [
        ("bbbbbbbb-0000-0000-0000-000000000001", "Alpha"),
        ("bbbbbbbb-0000-0000-0000-000000000002", "Beta"),
        ("bbbbbbbb-0000-0000-0000-000000000003", "Gamma"),
        ("bbbbbbbb-0000-0000-0000-000000000004", "Delta"),
    ];

    public void Seed()
    {
        var cutoff = DateTime.UtcNow.AddDays(-7);
        if (ctx.TurbineMetrics.Any(m => m.Timestamp < cutoff))
        {
            logger.LogInformation("Historical data already present — skipping historical seeder.");
            return;
        }

        var turbines = ctx.WindTurbines.ToList();
        if (turbines.Count == 0)
            turbines = EnsureDevTurbines();

        var start = DateTime.UtcNow - HistoryLength;
        var end   = DateTime.UtcNow.AddMinutes(-30);
        var totalPoints = (int)((end - start) / Interval);

        logger.LogInformation(
            "Seeding ~{Points} metric points for {N} turbines ({Start:yyyy-MM-dd} → {End:yyyy-MM-dd})…",
            totalPoints, turbines.Count, start, end);

        foreach (var turbine in turbines)
            SeedTurbine(turbine, start, end);

        logger.LogInformation("Historical seeding complete.");
    }

    // ── Per-turbine ──────────────────────────────────────────────────────────

    private void SeedTurbine(WindTurbine turbine, DateTime start, DateTime end)
    {
        var rng   = new Random(turbine.Id.GetHashCode());
        var batch = new List<TurbineMetric>(BatchSize);

        var windSpeed    = 7 + rng.NextDouble() * 5;
        var windDir      = rng.NextDouble() * 360;
        var current      = start;

        while (current <= end)
        {
            windSpeed = StepWindSpeed(windSpeed, current, rng);
            windDir   = StepWindDir(windDir, rng);

            batch.Add(BuildMetric(turbine, current, windSpeed, windDir, rng));

            if (batch.Count >= BatchSize)
            {
                ctx.TurbineMetrics.AddRange(batch);
                ctx.SaveChanges();
                batch.Clear();
            }

            current += Interval;
        }

        if (batch.Count > 0)
        {
            ctx.TurbineMetrics.AddRange(batch);
            ctx.SaveChanges();
        }
    }

    // ── Signal generators ─────────────────────────────────────────────────────

    /// Random walk toward a seasonal+daily target, clamped to [0.3, 27.5].
    private static double StepWindSpeed(double current, DateTime t, Random rng)
    {
        // Seasonal: peaks in winter (day ~15), troughs in summer (day ~196)
        var seasonal = 1 + 0.28 * Math.Cos(2 * Math.PI * (t.DayOfYear - 15) / 365.0);
        // Diurnal: slightly stronger in the afternoon
        var diurnal  = 1 + 0.07 * Math.Sin(2 * Math.PI * (t.Hour - 6) / 24.0);
        var target   = 8.5 * seasonal * diurnal;

        var delta = (target - current) * 0.04 + (rng.NextDouble() - 0.5) * 2.2;
        return Math.Clamp(current + delta, 0.3, 27.5);
    }

    /// Slow drift in wind direction (±15° per step max).
    private static double StepWindDir(double current, Random rng) =>
        (current + (rng.NextDouble() - 0.5) * 15 + 360) % 360;

    private static TurbineMetric BuildMetric(
        WindTurbine turbine, DateTime t, double windSpeed, double windDir, Random rng)
    {
        var running = windSpeed is >= CutInSpeed and <= CutOutSpeed;

        // Power (cubic ramp up to rated, flat above rated)
        var power = 0.0;
        if (running)
        {
            power = windSpeed <= RatedSpeed
                ? RatedPowerW * Math.Pow(windSpeed / RatedSpeed, 3)
                : RatedPowerW;
            power += (rng.NextDouble() - 0.5) * 4_000;
            power  = Math.Max(0, power);
        }

        // Rotor speed (5–15 rpm, proportional to wind)
        var rotorSpeed = running
            ? Math.Clamp(windSpeed * 1.05 + (rng.NextDouble() - 0.5) * 0.4, 5, 15)
            : 0;

        // Blade pitch: 0° at low wind, feathers above rated
        var bladePitch = running && windSpeed > RatedSpeed
            ? Math.Clamp((windSpeed - RatedSpeed) * 2.2, 0, 30)
            : 0;
        bladePitch += rng.NextDouble() * 0.4;

        // Ambient temperature: seasonal (≈ northern European offshore)
        var ambientTemp = 9 + 8 * Math.Sin(2 * Math.PI * (t.DayOfYear - 80) / 365.0)
                            + (rng.NextDouble() - 0.5) * 2.5;

        // Generator & gearbox temps correlate with load
        var loadFactor   = running ? power / RatedPowerW : 0;
        var generatorTemp = running ? ambientTemp + 30 + loadFactor * 20 + rng.NextDouble() * 5 : ambientTemp + 1;
        var gearboxTemp   = running ? ambientTemp + 25 + loadFactor * 18 + rng.NextDouble() * 5 : ambientTemp + 1;

        // Vibration: low normally, rare spikes
        var vibration = running ? 1.8 + rng.NextDouble() * 2.5 : 0.3 + rng.NextDouble() * 0.3;
        if (rng.NextDouble() < 0.004)              // ~0.4% chance of spike
            vibration = 9 + rng.NextDouble() * 5;

        var nacelleDir = (windDir + (rng.NextDouble() - 0.5) * 8 + 360) % 360;
        var status     = running ? "running" : "stopped";

        return new TurbineMetric
        {
            Id                 = Guid.NewGuid(),
            TurbineId          = turbine.Id,
            FarmId             = turbine.FarmId,
            Timestamp          = t,
            WindSpeed          = Math.Round(windSpeed, 2),
            WindDirection      = Math.Round(windDir, 1),
            AmbientTemperature = Math.Round(ambientTemp, 1),
            RotorSpeed         = Math.Round(rotorSpeed, 2),
            PowerOutput        = Math.Round(power, 0),
            NacelleDirection   = Math.Round(nacelleDir, 1),
            BladePitch         = Math.Round(bladePitch, 2),
            GeneratorTemp      = Math.Round(generatorTemp, 1),
            GearboxTemp        = Math.Round(gearboxTemp, 1),
            Vibration          = Math.Round(vibration, 3),
            Status             = status,
        };
    }

    // ── Dev turbine bootstrap ─────────────────────────────────────────────────

    private List<WindTurbine> EnsureDevTurbines()
    {
        var turbines = new List<WindTurbine>();
        foreach (var (id, name) in DevTurbineDefs)
        {
            var t = ctx.WindTurbines.Find(id);
            if (t == null)
            {
                t = new WindTurbine
                {
                    Id       = id,
                    Name     = name,
                    FarmId   = DevFarmId,
                    Status   = TurbineStatus.Running,
                    LastSeen = DateTime.UtcNow,
                };
                ctx.WindTurbines.Add(t);
            }
            turbines.Add(t);
        }
        ctx.SaveChanges();
        return turbines;
    }
}
