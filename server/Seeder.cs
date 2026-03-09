using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using server.Entities;

namespace server;

public class Seeder(MyDbContext ctx, ILogger<Seeder> logger, IPasswordHasher<User> passwordHasher)
{
    public void Seed()
    {
        logger.LogInformation("Seeding database...");
        logger.LogInformation(ctx.Database.GenerateCreateScript());
        ctx.Database.EnsureCreated();

        // Column migrations (safe to run on every startup)
        ctx.Database.ExecuteSqlRaw(@"
            ALTER TABLE iot_weatherstation.""WindTurbines""
            ADD COLUMN IF NOT EXISTS ""TelemetryIntervalSeconds"" integer NOT NULL DEFAULT 10;
        ");

        // AlertThresholds table migration
        ctx.Database.ExecuteSqlRaw(@"
            CREATE TABLE IF NOT EXISTS iot_weatherstation.""AlertThresholds"" (
                ""Id"" uuid NOT NULL,
                ""MetricName"" text NOT NULL,
                ""Value"" double precision NOT NULL,
                ""Severity"" text NOT NULL,
                ""Description"" text NOT NULL,
                ""IsEnabled"" boolean NOT NULL DEFAULT true,
                CONSTRAINT ""PK_AlertThresholds"" PRIMARY KEY (""Id"")
            );
        ");

        // Seed default alert thresholds if none exist
        if (!ctx.AlertThresholds.Any())
        {
            ctx.AlertThresholds.AddRange(
                new AlertThreshold
                {
                    Id = Guid.NewGuid(),
                    MetricName = "windSpeed",
                    Value = 25,
                    Severity = "critical",
                    Description = "High wind speed",
                    IsEnabled = true
                },
                new AlertThreshold
                {
                    Id = Guid.NewGuid(),
                    MetricName = "vibration",
                    Value = 10,
                    Severity = "warning",
                    Description = "High vibration",
                    IsEnabled = true
                },
                new AlertThreshold
                {
                    Id = Guid.NewGuid(),
                    MetricName = "generatorTemp",
                    Value = 80,
                    Severity = "warning",
                    Description = "Generator overheating",
                    IsEnabled = true
                },
                new AlertThreshold
                {
                    Id = Guid.NewGuid(),
                    MetricName = "gearboxTemp",
                    Value = 80,
                    Severity = "warning",
                    Description = "Gearbox overheating",
                    IsEnabled = true
                }
            );
            ctx.SaveChanges();
            logger.LogInformation("Default alert thresholds seeded.");
        }

        var exists = ctx.Users.Any(u => u.Email == "test@test.com");
        if (!exists)
        {
            var user = new User
            {
                Name = "Test User",
                Email = "test@test.com",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            user.Password = passwordHasher.HashPassword(user, "password123");
            ctx.Users.Add(user);
            ctx.SaveChanges();
            logger.LogInformation("Test user created: test@test.com / password123");
        }
    }
}
