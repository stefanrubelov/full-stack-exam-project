import { useEffect, useState } from 'react';
import { StateleSSEClient } from 'statele-sse';
import Layout from '../components/Layout';
import TurbineCard from '../components/TurbineCard';
import AlertsPanel from '../components/AlertsPanel';
import { type TurbineStatusDto, type TurbineAlert, realtimeApi, farmApi } from '../api/apiClient';
import { Wind, Activity, Zap, Bell } from 'lucide-react';

const sse = new StateleSSEClient(`${import.meta.env.VITE_API_URL ?? 'http://localhost:5233'}/sse`);

type ColorKey = 'accent' | 'success' | 'muted' | 'warning';

const colorMap: Record<ColorKey, { text: string; iconBg: string }> = {
  accent:  { text: 'text-accent',  iconBg: 'bg-accent/[12%]'  },
  success: { text: 'text-success', iconBg: 'bg-success/[12%]' },
  muted:   { text: 'text-muted',   iconBg: 'bg-muted/[12%]'   },
  warning: { text: 'text-warning', iconBg: 'bg-warning/[12%]' },
};

export default function DashboardPage() {
  const [turbines, setTurbines] = useState<TurbineStatusDto[]>([]);
  const [alerts, setAlerts] = useState<TurbineAlert[]>([]);
  const [connected, setConnected] = useState(false);
  const [farmId, setFarmId] = useState<string | null>(null);

  useEffect(() => {
    farmApi.get().then(d => setFarmId(d.farmId)).catch(() => {});
  }, []);

  useEffect(() => {
    let mounted = true;

    const unsubTurbines = sse.listen(
      async (id) => realtimeApi.getTurbines(id),
      (data) => { if (mounted) { setTurbines(data); setConnected(true); } }
    );

    const unsubAlerts = sse.listen(
      async (id) => realtimeApi.getTurbineAlerts(id),
      (data) => { if (mounted) setAlerts(data); }
    );

    return () => {
      mounted = false;
      unsubTurbines();
      unsubAlerts();
    };
  }, []);

  const running = turbines.filter(t => t.turbine.status === 'running').length;
  const stopped = turbines.filter(t => t.turbine.status === 'stopped').length;
  const totalPower = turbines.reduce((acc, t) => acc + (t.latestMetric?.powerOutput ?? 0), 0);

  const formatPower = (w: number) => {
    if (w >= 1_000_000) return `${(w / 1_000_000).toFixed(2)} MW`;
    if (w >= 1_000) return `${(w / 1_000).toFixed(1)} kW`;
    return `${w.toFixed(0)} W`;
  };

  return (
    <Layout alertCount={alerts.length}>
      <div className="px-8 py-7 max-w-[1400px] w-full">
        {/* Page header */}
        <div className="mb-7">
          <div className="flex items-center gap-2.5 mb-1.5">
            <h1 className="text-[1.75rem] font-bold text-ink tracking-[-0.5px]">Wind Farm Dashboard</h1>
            <div className={`flex items-center gap-[5px] px-2.5 py-[3px] rounded-[20px] text-[0.72rem] font-semibold ${
              connected ? 'bg-success/[12%] text-success' : 'bg-muted/[12%] text-muted'
            }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current inline-block" />
              {connected ? 'Live' : 'Connecting…'}
            </div>
          </div>
          <p className="text-dim text-sm">
            Monitoring {turbines.length} turbine{turbines.length !== 1 ? 's' : ''} in real-time
            {farmId && <span className="ml-2 text-faint">· Farm <span className="font-mono">{farmId}</span></span>}
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
          <StatCard icon={<Wind size={20} />} label="Total Turbines" value={turbines.length.toString()} colorKey="accent" />
          <StatCard icon={<Activity size={20} />} label="Running" value={running.toString()} colorKey="success" />
          <StatCard icon={<Activity size={20} />} label="Stopped" value={stopped.toString()} colorKey="muted" />
          <StatCard icon={<Zap size={20} />} label="Total Output" value={formatPower(totalPower)} colorKey="warning" />
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6 items-start">
          {/* Turbines grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-ink">Turbines</h2>
            </div>
            {turbines.length === 0 ? (
              <div className="bg-card border border-edge rounded-[10px] p-5 text-center py-10 px-6 text-faint">
                <Wind size={40} className="mx-auto opacity-30" />
                <h4 className="mt-3 text-dim font-semibold">No turbines detected</h4>
                <p>Waiting for turbines to connect via MQTT…</p>
                <p className="mt-2 text-[0.8rem]">
                  Open the IoT simulator at{' '}
                  <a href="https://sea-fullstack.web.app/" target="_blank" rel="noreferrer">
                    sea-fullstack.web.app
                  </a>{' '}
                  to start streaming data.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {turbines.map(t => (
                  <TurbineCard key={t.turbine.id} data={t} />
                ))}
              </div>
            )}
          </div>

          {/* Alerts sidebar */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Bell size={17} className="text-ink" />
                <h2 className="text-xl font-semibold text-ink">Active Alerts</h2>
              </div>
              {alerts.length > 0 && (
                <span className="inline-flex items-center gap-[5px] px-2.5 py-[3px] rounded-[20px] text-[0.72rem] font-semibold uppercase tracking-[0.5px] bg-danger/[12%] text-danger">
                  {alerts.length}
                </span>
              )}
            </div>
            <div className="bg-card border border-edge rounded-[10px] p-4">
              <AlertsPanel alerts={alerts.slice(0, 5)} />
              {alerts.length > 5 && (
                <p className="mt-3 text-center text-[0.75rem] text-faint">
                  +{alerts.length - 5} more — <a href="/alerts" className="text-accent hover:underline">view all</a>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function StatCard({ icon, label, value, colorKey }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  colorKey: ColorKey;
}) {
  const c = colorMap[colorKey];
  return (
    <div className="bg-card border border-edge rounded-[10px] px-5 py-4">
      <div className="flex items-center gap-2.5 mb-2.5">
        <div className={`w-9 h-9 rounded-lg ${c.iconBg} flex items-center justify-center ${c.text}`}>
          {icon}
        </div>
        <span className="text-[0.8rem] text-dim">{label}</span>
      </div>
      <div className={`text-[1.6rem] font-bold tabular-nums ${c.text}`}>{value}</div>
    </div>
  );
}
