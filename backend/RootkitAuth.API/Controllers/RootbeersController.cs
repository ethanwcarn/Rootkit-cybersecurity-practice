using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RootkitAuth.API.Data;

namespace RootkitAuth.API.Controllers;

[Route("api/[controller]")]
[ApiController]
public class RootbeersController(ApplicationDbContext dbContext) : ControllerBase
{
    [HttpGet]
    public IActionResult GetRootbeers(
        [FromQuery] int pageSize = 10,
        [FromQuery] int pageNum = 1,
        [FromQuery] List<string>? containers = null)
    {
        pageSize = Math.Clamp(pageSize, 1, 50);
        pageNum = Math.Max(pageNum, 1);

        var query = dbContext.Rootbeers.AsNoTracking().AsQueryable();

        if (containers is { Count: > 0 })
        {
            query = query.Where(rootbeer =>
                rootbeer.Container != null && containers.Contains(rootbeer.Container));
        }

        var totalCount = query.Count();
        var rootbeers = query
            .OrderBy(rootbeer => rootbeer.RootbeerName)
            .Skip((pageNum - 1) * pageSize)
            .Take(pageSize)
            .ToList();

        return Ok(new
        {
            rootbeers,
            totalCount
        });
    }

    [HttpGet("containers")]
    public IActionResult GetContainerTypes()
    {
        var containerTypes = dbContext.Rootbeers
            .AsNoTracking()
            .Where(rootbeer => !string.IsNullOrWhiteSpace(rootbeer.Container))
            .Select(rootbeer => rootbeer.Container!)
            .Distinct()
            .OrderBy(container => container)
            .ToList();

        return Ok(containerTypes);
    }
}
