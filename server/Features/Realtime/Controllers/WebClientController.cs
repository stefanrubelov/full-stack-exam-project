using Microsoft.AspNetCore.Mvc;
using server.Entities;
using server.Features.Turbines.Models.Responses;
using StateleSSE.AspNetCore;
using StateleSSE.AspNetCore.EfRealtime;
using StateleSSE.AspNetCore.GroupRealtime;

namespace server.Features.Realtime.Controllers;

public class WebClientController(
    ISseBackplane backplane,
    IRealtimeManager realtimeManager,
    MyDbContext db,
    IGroupRealtimeManager groupRealtimeManager
) : RealtimeControllerBase(backplane)
{
    [HttpGet(nameof(GetMeasurements))]
    public async Task<RealtimeListenResponse<List<Measurement>>> GetMeasurements(string connectionId)
    {
        var group = "measurements";
        await backplane.Groups.AddToGroupAsync(connectionId, group);
        realtimeManager.Subscribe<MyDbContext>(connectionId, group,
            criteria: snapshot => snapshot.HasChanges<Measurement>(),
            query: async context => context.Measurements.ToList());
        return new RealtimeListenResponse<List<Measurement>>(group, db.Measurements.ToList());
    }

    [HttpGet(nameof(GetTurbines))]
    public async Task<RealtimeListenResponse<List<TurbineStatusDto>>> GetTurbines(string connectionId)
    {
        var group = "turbine-status";
        await backplane.Groups.AddToGroupAsync(connectionId, group);
        realtimeManager.Subscribe<MyDbContext>(connectionId, group,
            criteria: snapshot => snapshot.HasChanges<WindTurbine>() || snapshot.HasChanges<TurbineMetric>(),
            query: async context => BuildTurbineStatuses(context));
        return new RealtimeListenResponse<List<TurbineStatusDto>>(group, BuildTurbineStatuses(db));
    }

    [HttpGet(nameof(GetTurbineAlerts))]
    public async Task<RealtimeListenResponse<List<TurbineAlert>>> GetTurbineAlerts(string connectionId)
    {
        var group = "turbine-alerts";
        await backplane.Groups.AddToGroupAsync(connectionId, group);
        realtimeManager.Subscribe<MyDbContext>(connectionId, group,
            criteria: snapshot => snapshot.HasChanges<TurbineAlert>(),
            query: async context => context.TurbineAlerts
                .Where(a => !a.IsAcknowledged)
                .OrderByDescending(a => a.Timestamp)
                .Take(50)
                .ToList());

        var initial = db.TurbineAlerts
            .Where(a => !a.IsAcknowledged)
            .OrderByDescending(a => a.Timestamp)
            .Take(50)
            .ToList();
        return new RealtimeListenResponse<List<TurbineAlert>>(group, initial);
    }

    [HttpGet(nameof(GetTurbineMetrics))]
    public async Task<RealtimeListenResponse<List<TurbineMetric>>> GetTurbineMetrics(string connectionId, string turbineId)
    {
        var group = $"turbine-metrics-{turbineId}";
        await backplane.Groups.AddToGroupAsync(connectionId, group);
        realtimeManager.Subscribe<MyDbContext>(connectionId, group,
            criteria: snapshot => snapshot.HasChanges<TurbineMetric>(),
            query: async context => context.TurbineMetrics
                .Where(m => m.TurbineId == turbineId)
                .OrderByDescending(m => m.Timestamp)
                .Take(50)
                .ToList());

        var initial = db.TurbineMetrics
            .Where(m => m.TurbineId == turbineId)
            .OrderByDescending(m => m.Timestamp)
            .Take(50)
            .ToList();
        return new RealtimeListenResponse<List<TurbineMetric>>(group, initial);
    }

    private static List<TurbineStatusDto> BuildTurbineStatuses(MyDbContext context)
    {
        var turbines = context.WindTurbines.OrderBy(t => t.Name).ToList();
        return turbines.Select(t =>
        {
            var latest = context.TurbineMetrics
                .Where(m => m.TurbineId == t.Id)
                .OrderByDescending(m => m.Timestamp)
                .FirstOrDefault();
            return new TurbineStatusDto(t, latest);
        }).ToList();
    }
}