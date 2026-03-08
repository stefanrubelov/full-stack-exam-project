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
