import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { StateleSSEClient } from 'statele-sse';
import Layout from '../components/Layout';
import MetricsChart, { type MetricConfig } from '../components/MetricsChart';
import AlertsPanel from '../components/AlertsPanel';
import TurbineControls, { CommandHistory } from '../components/TurbineControls';
import MetricsHistoryTab from '../components/MetricsHistoryTab';
import {
  type TurbineMetric, type TurbineAlert, type TurbineCommand, type TurbineStatusDto,
  realtimeApi, turbinesApi, alertsApi,
} from '../api/apiClient';
import { ArrowLeft, Wind, Zap, Thermometer, Activity, Compass, RotateCcw, Waves, AlertTriangle, Settings, ChevronDown } from 'lucide-react';

const sse = new StateleSSEClient(`${import.meta.env.VITE_API_URL ?? 'http://localhost:5233'}/sse`);

const METRIC_CHARTS: MetricConfig[] = [
  { key: 'windSpeed',           label: 'Wind Speed',      unit: 'm/s', color: '#38bdf8' },
  { key: 'powerOutput',         label: 'Power Output',    unit: 'W',   color: '#22c55e' },
  { key: 'rotorSpeed',          label: 'Rotor Speed',     unit: 'rpm', color: '#a78bfa' },
  { key: 'bladePitch',          label: 'Blade Pitch',     unit: '°',   color: '#f59e0b' },
  { key: 'generatorTemp',       label: 'Generator Temp',  unit: '°C',  color: '#ef4444' },
  { key: 'gearboxTemp',         label: 'Gearbox Temp',    unit: '°C',  color: '#fb923c' },
  { key: 'vibration',           label: 'Vibration',       unit: '',    color: '#ec4899' },
  { key: 'ambientTemperature',  label: 'Ambient Temp',    unit: '°C',  color: '#34d399' },
];

function statusBadgeClass(s: string) {
  if (s === 'running') return 'bg-success/[12%] text-success';
  if (s === 'stopped') return 'bg-muted/15 text-muted';
  return 'bg-warning/[12%] text-warning';
}

function formatPower(w: number) {
  if (w >= 1_000_000) return `${(w / 1_000_000).toFixed(2)} MW`;
  if (w >= 1_000) return `${(w / 1_000).toFixed(1)} kW`;
  return `${w.toFixed(0)} W`;
}

export default function TurbineDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [turbineData, setTurbineData] = useState<TurbineStatusDto | null>(null);
  const [metrics, setMetrics] = useState<TurbineMetric[]>([]);
  const [alerts, setAlerts] = useState<TurbineAlert[]>([]);
  const [allAlerts, setAllAlerts] = useState<TurbineAlert[]>([]);
  const [commands, setCommands] = useState<TurbineCommand[]>([]);
  const [activeTab, setActiveTab] = useState<'metrics' | 'alerts' | 'history' | 'data-history'>('metrics');
  const [controlsOpen, setControlsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const refreshCommands = useCallback(async () => {
    if (!id) return;
    try {
      const cmds = await turbinesApi.getCommands(id);
      setCommands(cmds);
    } catch (e) {
      console.error(e);
    }
  }, [id]);

  const refreshAlerts = useCallback(async () => {
    if (!id) return;
    try {
      const a = await alertsApi.getAll();
      setAlerts(a.filter(al => al.turbineId === id));
    } catch (e) {
      console.error(e);
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const [td, cmds, al] = await Promise.all([
          turbinesApi.getById(id),
          turbinesApi.getCommands(id),
          alertsApi.getAll(),
        ]);
        setTurbineData(td);
        setCommands(cmds);
        setAllAlerts(al);
        setAlerts(al.filter(a => a.turbineId === id));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    let mounted = true;

    const unsubMetrics = sse.listen(
      async (connectionId) => realtimeApi.getTurbineMetrics(connectionId, id),
      (data) => {
        if (!mounted) return;
        setMetrics(data);
        if (data.length > 0) {
          setTurbineData(prev => prev ? { ...prev, latestMetric: data[0] } : prev);
        }
      }
    );

    const unsubTurbines = sse.listen(
      async (connectionId) => realtimeApi.getTurbines(connectionId),
      (data) => {
        if (!mounted) return;
        const match = data.find(t => t.turbine.id === id);
        if (match) {
          setTurbineData(prev => prev ? {
            ...prev,
            turbine: { ...prev.turbine, status: match.turbine.status },
          } : prev);
        }
      }
    );

    const unsubAlerts = sse.listen(
      async (connectionId) => realtimeApi.getTurbineAlerts(connectionId),
      (data) => {
        if (!mounted) return;
        setAllAlerts(data);
        setAlerts(data.filter(a => a.turbineId === id));
      }
    );

    return () => {
      mounted = false;
      unsubMetrics();
      unsubTurbines();
      unsubAlerts();
    };
  }, [id]);

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-full p-10">
          <span className="inline-block w-8 h-8 rounded-full border-2 border-edge border-t-accent animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!turbineData) {
    return (
      <Layout>
        <div className="p-8">
          <button
            className="flex items-center gap-1.5 px-3 py-[5px] text-[0.8rem] font-medium rounded-md cursor-pointer border transition-all duration-150 bg-card text-ink border-edge hover:bg-lift hover:border-edge-light"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft size={14} /> Back
          </button>
          <div className="text-center py-10 px-6 text-faint mt-8">
            <p>Turbine not found.</p>
          </div>
        </div>
      </Layout>
    );
  }

  const { turbine, latestMetric: m } = turbineData;
  const alertCount = alerts.length;

  const tabs = [
    { id: 'metrics',      label: 'Live Metrics' },
    { id: 'alerts',       label: `Alerts${alertCount > 0 ? ` (${alertCount})` : ''}` },
    { id: 'data-history', label: 'Data History' },
    { id: 'history',      label: 'Command History' },
  ] as const;

  return (
    <Layout alertCount={allAlerts.length}>
      <div className="px-8 py-7 max-w-[1400px] w-full">
        {/* Back */}
        <button
          className="flex items-center gap-1.5 px-3 py-[5px] text-[0.8rem] font-medium rounded-md cursor-pointer border transition-all duration-150 bg-card text-ink border-edge hover:bg-lift hover:border-edge-light mb-5"
          onClick={() => navigate('/dashboard')}
        >
          <ArrowLeft size={14} /> Back to Dashboard
        </button>

        {/* Turbine header */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-[52px] h-[52px] rounded-xl bg-gradient-to-br from-sky-500 to-accent flex items-center justify-center shrink-0">
              <Wind size={26} color="#0b1120" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <h1 className="text-[1.75rem] font-bold text-ink tracking-[-0.5px]">Turbine {turbine.name}</h1>
                <span className={`inline-flex items-center gap-[5px] px-2.5 py-[3px] rounded-[20px] text-[0.72rem] font-semibold uppercase tracking-[0.5px] ${statusBadgeClass(turbine.status)}`}>
                  {turbine.status}
                </span>
              </div>
              <p className="text-faint text-[0.8rem]">
                Turbine ID: {turbine.id.substring(0, 12)}…
              </p>
            </div>
          </div>
          <button
            onClick={() => setControlsOpen(o => !o)}
            className={`flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg border transition-all duration-150 cursor-pointer ${
              controlsOpen
                ? 'bg-accent/10 border-accent/40 text-accent'
                : 'bg-card border-edge text-ink hover:bg-lift hover:border-edge-light'
            }`}
          >
            <Settings size={15} className={`transition-transform duration-300 ${controlsOpen ? 'rotate-45' : ''}`} />
            Controls
            <ChevronDown size={14} className={`transition-transform duration-300 ${controlsOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Controls accordion */}
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${controlsOpen ? 'max-h-[600px] mb-5' : 'max-h-0'}`}>
          <div className="bg-card border border-edge rounded-[10px] p-5">
            <TurbineControls
              turbineId={turbine.id}
              turbineStatus={turbine.status}
              onCommandSent={refreshCommands}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-edge mb-5">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`bg-transparent border-none border-b-2 rounded-none px-5 py-2.5 text-sm cursor-pointer transition-all duration-150 -mb-px ${
                activeTab === tab.id
                  ? 'border-b-accent text-accent font-semibold'
                  : 'border-b-transparent text-dim font-normal hover:text-ink'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'metrics' && (
          <>
            {m && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
                <SnapCard icon={<Wind size={16} />} label="Wind Speed" value={`${m.windSpeed.toFixed(1)} m/s`} />
                <SnapCard icon={<Zap size={16} />} label="Power Output" value={formatPower(m.powerOutput)} colorClass="text-success" />
                <SnapCard icon={<Activity size={16} />} label="Rotor Speed" value={`${m.rotorSpeed.toFixed(1)} rpm`} />
                <SnapCard icon={<RotateCcw size={16} />} label="Blade Pitch" value={`${m.bladePitch.toFixed(1)}°`} />
                <SnapCard icon={<Thermometer size={16} />} label="Generator Temp" value={`${m.generatorTemp.toFixed(1)}°C`} colorClass={m.generatorTemp > 75 ? 'text-warning' : undefined} />
                <SnapCard icon={<Thermometer size={16} />} label="Gearbox Temp" value={`${m.gearboxTemp.toFixed(1)}°C`} colorClass={m.gearboxTemp > 75 ? 'text-warning' : undefined} />
                <SnapCard icon={<Waves size={16} />} label="Vibration" value={m.vibration.toFixed(2)} colorClass={m.vibration > 8 ? 'text-warning' : undefined} />
                <SnapCard icon={<Compass size={16} />} label="Wind Direction" value={`${m.windDirection.toFixed(0)}°`} />
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {METRIC_CHARTS.map(cfg => (
                <div key={cfg.key} className="bg-card border border-edge rounded-[10px] px-5 py-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: cfg.color }} />
                    <h4 className="font-semibold text-ink">{cfg.label}</h4>
                    <span className="ml-auto text-xs text-faint">{cfg.unit}</span>
                  </div>
                  <MetricsChart metrics={metrics} config={cfg} height={160} />
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'alerts' && (
          <div className="bg-card border border-edge rounded-[10px] p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle size={17} className="text-ink" />
                <h3 className="font-semibold text-ink">Active Alerts</h3>
              </div>
            </div>
            <AlertsPanel alerts={alerts} turbineId={turbine.id} onAcknowledge={refreshAlerts} />
          </div>
        )}

        {activeTab === 'data-history' && (
          <MetricsHistoryTab turbineId={turbine.id} />
        )}

        {activeTab === 'history' && (
          <div className="bg-card border border-edge rounded-[10px] p-5">
            <h3 className="font-semibold text-ink mb-4">Command History</h3>
            <CommandHistory commands={commands} />
          </div>
        )}
      </div>
    </Layout>
  );
}

function SnapCard({ icon, label, value, colorClass }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  colorClass?: string;
}) {
  return (
    <div className="bg-card border border-edge rounded-[10px] px-4 py-3">
      <div className="flex items-center gap-1.5 text-faint text-xs mb-2">
        {icon}
        {label}
      </div>
      <div className={`text-[1.1rem] font-bold tabular-nums ${colorClass ?? 'text-ink'}`}>
        {value}
      </div>
    </div>
  );
}
