using Microsoft.EntityFrameworkCore;
using server.Entities;

namespace server.Repositories;

public class UserRepository(MyDbContext context) : BaseRepository<User>(context)
{
    protected override DbSet<User> Set => Context.Users;
}