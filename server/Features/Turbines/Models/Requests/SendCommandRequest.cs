namespace server.Features.Turbines.Models.Requests;

public record SendCommandRequest(string Action, double? Value = null, double? Angle = null, string? Reason = null);
