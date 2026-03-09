using server.Entities;

namespace server.Features.AlertThresholds;

public class AlertThresholdCache
{
    private List<AlertThreshold> _cache = [];
    private bool _loaded;
    private readonly Lock _lock = new();

    public List<AlertThreshold> GetEnabled(MyDbContext db)
    {
        lock (_lock)
        {
            if (!_loaded)
            {
                _cache = db.AlertThresholds.Where(t => t.IsEnabled).ToList();
                _loaded = true;
            }
            return _cache;
        }
    }

    public void Invalidate()
    {
        lock (_lock)
        {
            _loaded = false;
        }
    }
}
