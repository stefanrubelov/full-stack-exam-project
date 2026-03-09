using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace server.Features.Users.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController(MyDbContext db) : ControllerBase
{
    [HttpGet]
    public ActionResult GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null)
    {
        pageSize = Math.Clamp(pageSize, 1, 100);
        page = Math.Max(1, page);

        var query = db.Users.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var lower = search.ToLower();
            query = query.Where(u =>
                u.Name.ToLower().Contains(lower) ||
                u.Email.ToLower().Contains(lower));
        }

        var total = query.Count();
        var items = query
            .OrderBy(u => u.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new { u.Id, u.Name, u.Email, u.CreatedAt })
            .ToList();

        return Ok(new { total, page, pageSize, items });
    }
}
