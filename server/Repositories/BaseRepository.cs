using Microsoft.EntityFrameworkCore;

namespace server.Repositories;

public abstract class BaseRepository<T>(MyDbContext context) : IBaseRepository<T>
    where T : class
{
    protected MyDbContext Context => context;

    protected virtual DbSet<T> Set => context.Set<T>();

    public async Task AddAsync(T entity)
    {
        await Set.AddAsync(entity);
        await context.SaveChangesAsync();
    }

    public virtual async Task DeleteAsync(T entity)
    {
        Set.Remove(entity);
        await context.SaveChangesAsync();
    }

    public async Task<T?> GetAsync(Func<T, bool> predicate)
    {
        return await Task.FromResult(Set.Where(predicate).SingleOrDefault());
    }

    public IQueryable<T> Query()
    {
        return Set.AsNoTracking();
    }

    public async Task UpdateAsync(T entity)
    {
        Set.Update(entity);
        await context.SaveChangesAsync();
    }
}
