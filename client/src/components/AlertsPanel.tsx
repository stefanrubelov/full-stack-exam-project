import { useState } from 'react';
import { type TurbineAlert, alertsApi } from '../api/apiClient';
import { BellOff, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

interface Props {
  alerts: TurbineAlert[];
  onAcknowledge?: () => void;
  turbineId?: string;
}

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 10) return 'just now';
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  const h = Math.floor(s / 3600);
  if (h < 24) return `${h}h ago`;
  return new Date(iso).toLocaleDateString();
}

function SeverityIcon({ severity }: { severity: string }) {
  if (severity === 'critical') return <XCircle size={15} color="#ef4444" />;
  return <AlertTriangle size={15} color="#f59e0b" />;
}

export default function AlertsPanel({ alerts, onAcknowledge, turbineId }: Props) {
  const [ackingId, setAckingId] = useState<string | null>(null);

  const visible = turbineId ? alerts.filter(a => a.turbineId === turbineId) : alerts;

  const acknowledge = async (id: string) => {
    setAckingId(id);
    try {
      await alertsApi.acknowledge(id);
      onAcknowledge?.();
    } catch (e) {
      console.error('Failed to acknowledge alert', e);
    } finally {
      setAckingId(null);
    }
  };

  if (visible.length === 0) {
    return (
      <div className="text-center py-10 px-6 text-faint">
        <BellOff size={36} className="mx-auto" />
        <h4 className="mt-2 text-dim font-semibold">No active alerts</h4>
        <p>All systems are operating normally</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {visible.map(alert => (
        <div
          key={alert.id}
          className={`flex items-start gap-2.5 px-3.5 py-3 rounded-md border ${
            alert.severity === 'critical'
              ? 'bg-danger/[12%] border-danger/30'
              : 'bg-warning/[12%] border-warning/30'
          }`}
        >
          <div className="pt-px shrink-0">
            <SeverityIcon severity={alert.severity} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`inline-flex items-center gap-[5px] px-2.5 py-[3px] rounded-[20px] text-[0.72rem] font-semibold uppercase tracking-[0.5px] ${
                alert.severity === 'critical' ? 'bg-danger/[12%] text-danger' : 'bg-warning/[12%] text-warning'
              }`}>
                {alert.severity}
              </span>
              {!turbineId && (
                <span className="text-xs text-faint">
                  Turbine {alert.turbineId.substring(0, 8)}…
                </span>
              )}
            </div>
            <p className="text-[0.85rem] text-ink mb-1">{alert.message}</p>
            <p className="text-[0.72rem] text-faint">{timeAgo(alert.timestamp)}</p>
          </div>
          <button
            onClick={() => acknowledge(alert.id)}
            disabled={ackingId === alert.id}
            title="Acknowledge alert"
            className="flex items-center gap-1 bg-transparent border border-edge rounded-md px-2 py-1 text-dim text-xs cursor-pointer shrink-0 hover:text-ink transition-colors duration-150 disabled:opacity-50"
          >
            {ackingId === alert.id ? (
              <span className="inline-block w-3 h-3 rounded-full border-[1.5px] border-edge border-t-accent animate-spin shrink-0" />
            ) : (
              <CheckCircle size={13} />
            )}
            Ack
          </button>
        </div>
      ))}
    </div>
  );
}
