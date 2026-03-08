import { useEffect, useRef, useState } from 'react';
import { StateleSSEClient } from 'statele-sse';
import Layout from '../components/Layout';
import AlertsPanel from '../components/AlertsPanel';
import { type TurbineAlert, realtimeApi, alertsApi } from '../api/apiClient';
import { Bell, CheckCheck } from 'lucide-react';
import toast from 'react-hot-toast';

const sse = new StateleSSEClient(`${import.meta.env.VITE_API_URL ?? 'http://localhost:5233'}/sse`);

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<TurbineAlert[]>([]);
  const [showAcknowledged, setShowAcknowledged] = useState(false);
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState<TurbineAlert[]>([]);

  const refreshAcknowledged = async () => {
    if (!showAcknowledged) return;
    try {
      const all = await alertsApi.getAll(true);
      setAcknowledgedAlerts(all.filter(a => a.isAcknowledged));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    let mounted = true;
    const unsub = sse.listen(
      async (id) => realtimeApi.getTurbineAlerts(id),
      (data) => {
        if (!mounted) return;
        setAlerts(data);
      }
    );
    return () => {
      mounted = false;
      unsub();
    };
  }, []);

  useEffect(() => {
    if (showAcknowledged) refreshAcknowledged();
  }, [showAcknowledged]);

  const handleAcknowledge = () => {
    toast.success('Alert acknowledged');
    if (showAcknowledged) refreshAcknowledged();
  };

  const btnActive = 'flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-[0.8rem] font-semibold rounded-md bg-accent text-surface border-none cursor-pointer transition-all duration-150 hover:bg-sky-300';
  const btnInactive = 'flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-[0.8rem] font-medium rounded-md bg-card text-ink border border-edge cursor-pointer transition-all duration-150 hover:bg-lift hover:border-edge-light';

  return (
    <Layout alertCount={alerts.length}>
      <div className="px-8 py-7 max-w-[1400px] w-full">
        <div className="mb-6">
          <div className="flex items-center gap-2.5 mb-1.5">
            <Bell size={22} className="text-ink" />
            <h1 className="text-[1.75rem] font-bold text-ink tracking-[-0.5px]">Alerts</h1>
            {alerts.length > 0 && (
              <span className="inline-flex items-center gap-[5px] px-2.5 py-[3px] rounded-[20px] text-[0.72rem] font-semibold uppercase tracking-[0.5px] bg-danger/[12%] text-danger">
                {alerts.length}
              </span>
            )}
          </div>
          <p className="text-dim text-sm">All active system alerts from wind turbines</p>
        </div>

        {/* Controls */}
        <div className="flex gap-2.5 mb-5">
          <button
            className={showAcknowledged ? btnInactive : btnActive}
            onClick={() => setShowAcknowledged(false)}
          >
            Active ({alerts.length})
          </button>
          <button
            className={showAcknowledged ? btnActive : btnInactive}
            onClick={() => setShowAcknowledged(true)}
          >
            <CheckCheck size={13} />
            Acknowledged
          </button>
        </div>

        <div className="bg-card border border-edge rounded-[10px] p-5">
          {!showAcknowledged ? (
            <AlertsPanel alerts={alerts} onAcknowledge={handleAcknowledge} />
          ) : (
            acknowledgedAlerts.length === 0 ? (
              <div className="text-center py-10 px-6 text-faint">
                <CheckCheck size={32} className="mx-auto" />
                <h4 className="mt-2 text-dim font-semibold">No acknowledged alerts</h4>
                <p>Acknowledged alerts will appear here</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {acknowledgedAlerts.map(a => (
                  <div
                    key={a.id}
                    className="px-3.5 py-2.5 bg-canvas rounded-lg border border-edge"
                  >
                    <div className="flex gap-2 items-center mb-1">
                      <span className="inline-flex items-center gap-[5px] px-2.5 py-[3px] rounded-[20px] text-[0.72rem] font-semibold uppercase tracking-[0.5px] bg-muted/[12%] text-muted">
                        {a.severity}
                      </span>
                      <span className="text-xs text-ink/60">
                        Turbine {a.turbineId}
                      </span>
                    </div>
                    <p className="text-[0.85rem] text-ink">{a.message}</p>
                    <p className="text-[0.75rem] text-ink/50 mt-1">
                      Acknowledged {a.acknowledgedAt ? new Date(a.acknowledgedAt).toLocaleString() : ''}
                    </p>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </Layout>
  );
}
