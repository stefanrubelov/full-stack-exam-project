import { useNavigate } from 'react-router-dom';
import { type TurbineStatusDto } from '../api/apiClient';
import { TurbineStatus } from '../enums';
import { ArrowRight } from 'lucide-react';

interface Props {
  data: TurbineStatusDto;
}

function statusBadgeClass(status: string) {
  if (status === TurbineStatus.Running) return 'bg-success/[12%] text-success';
  if (status === TurbineStatus.Stopped) return 'bg-muted/15 text-muted';
  return 'bg-warning/[12%] text-warning';
}

function dotBgClass(status: string) {
  if (status === TurbineStatus.Running) return 'bg-success shadow-[0_0_5px_#22c55e]';
  if (status === TurbineStatus.Stopped) return 'bg-muted';
  return 'bg-warning shadow-[0_0_5px_#f59e0b]';
}

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 10) return 'just now';
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

export default function TurbineCard({ data }: Props) {
  const navigate = useNavigate();
  const { turbine, latestMetric: m } = data;
  const status = turbine.status ?? 'unknown';

  return (
    <div
      className="bg-card border border-edge rounded-[10px] p-5 cursor-pointer transition-all duration-150 hover:border-[#0D1B2A]/20 hover:shadow-[0_4px_16px_rgba(13,27,42,0.1)]"
      onClick={() => navigate(`/turbines/${turbine.id}`)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-flex items-center gap-[5px] px-2.5 py-[3px] rounded-[20px] text-[0.72rem] font-semibold uppercase tracking-[0.5px] ${statusBadgeClass(status)}`}>
              <span className={`w-[7px] h-[7px] rounded-full shrink-0 ${dotBgClass(status)}`} />
              {status}
            </span>
          </div>
          <h3 className="text-[1.1rem] text-ink">Turbine {turbine.name}</h3>
          <p className="text-faint text-xs mt-0.5">
            {m ? `Updated ${timeAgo(turbine.lastSeen)}` : 'No data received yet'}
          </p>
        </div>
        <div className="w-10 h-10 bg-accent/15 border border-accent/20 rounded-[10px] flex items-center justify-center shrink-0">
          <span className="text-accent font-bold text-[1.1rem]">{turbine.name.charAt(0).toUpperCase()}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-edge">
        <span className="text-faint text-xs font-mono">{turbine.id}</span>
        <span className="text-[0.8rem] text-accent flex items-center gap-1 shrink-0 ml-3">
          View details <ArrowRight size={13} />
        </span>
      </div>
    </div>
  );
}
