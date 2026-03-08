using server.Entities;

namespace server.Features.Turbines.Models.Responses;

public record TurbineStatusDto(WindTurbine Turbine, TurbineMetric? LatestMetric);
