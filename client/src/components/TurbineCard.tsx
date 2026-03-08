import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { type TurbineStatusDto, turbinesApi } from '../api/apiClient';
import { Wind, Zap, Thermometer, Activity, ArrowRight, Settings, ChevronDown, Play, Square, Sliders, Clock } from 'lucide-react';

interface Props {
  data: TurbineStatusDto;
}

function statusBadgeClass(status: string) {
  if (status === 'running') return 'bg-success/[12%] text-success';
  if (status === 'stopped') return 'bg-muted/15 text-muted';
  return 'bg-warning/[12%] text-warning';
}

function dotBgClass(status: string) {
  if (status === 'running') return 'bg-success shadow-[0_0_5px_#22c55e]';
  if (status === 'stopped') return 'bg-muted';
  return 'bg-warning shadow-[0_0_5px_#f59e0b]';
}

function formatPower(w: number) {
  if (w >= 1_000_000) return `${(w / 1_000_000).toFixed(2)} MW`;
  if (w >= 1_000) return `${(w / 1_000).toFixed(1)} kW`;
  return `${w.toFixed(0)} W`;
}

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 10) return 'just now';
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

function Spinner() {
  return <span className="inline-block w-2.5 h-2.5 rounded-full border border-current border-t-transparent animate-spin shrink-0" />;
}

export default function TurbineCard({ data }: Props) {
  const navigate = useNavigate();
  const { turbine, latestMetric: m } = data;
  const status = turbine.status ?? 'unknown';

  const [menuOpen, setMenuOpen] = useState(false);
  const [cmdLoading, setCmdLoading] = useState<string | null>(null);
  const [cmdError, setCmdError] = useState('');
  const [pitchVal, setPitchVal] = useState('15');
  const [intervalSec, setIntervalSec] = useState('10');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onMouse = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('mousedown', onMouse);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onMouse);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const sendCmd = async (action: string, params?: Record<string, unknown>) => {
    setCmdError('');
    setCmdLoading(action);
    try {
      await turbinesApi.sendCommand(turbine.id, action, params);
    } catch (e) {
      setCmdError(e instanceof Error ? e.message : 'Command failed');
    } finally {
      setCmdLoading(null);
    }
  };

  return (
    <div
      className="bg-card border border-edge rounded-[10px] p-5 cursor-pointer transition-all duration-150 hover:border-edge-light hover:bg-lift"
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

      {/* Metrics grid */}
      {m ? (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <MetricItem
            icon={<Wind size={14} />}
            label="Wind Speed"
            value={m.windSpeed.toFixed(1)}
            unit="m/s"
            valueClass={m.windSpeed > 25 ? 'text-danger' : m.windSpeed > 20 ? 'text-warning' : 'text-ink'}
          />
          <MetricItem
            icon={<Activity size={14} />}
            label="Rotor RPM"
            value={m.rotorSpeed.toFixed(1)}
            unit="rpm"
          />
          <MetricItem
            icon={<Zap size={14} />}
            label="Power Output"
            value={formatPower(m.powerOutput)}
            unit=""
            valueClass="text-success"
          />
          <MetricItem
            icon={<Thermometer size={14} />}
            label="Gen. Temp"
            value={m.generatorTemp.toFixed(1)}
            unit="°C"
            valueClass={m.generatorTemp > 80 ? 'text-danger' : m.generatorTemp > 75 ? 'text-warning' : 'text-ink'}
          />
        </div>
      ) : (
        <div className="h-20 flex items-center justify-center text-faint text-[0.85rem]">
          Waiting for telemetry…
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-edge">
        {/* Controls dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={e => { e.stopPropagation(); setCmdError(''); setMenuOpen(v => !v); }}
            className={`flex items-center gap-1 text-[0.8rem] font-medium rounded-md px-2 py-1 -mx-2 border transition-all duration-150 ${
              menuOpen
                ? 'text-accent bg-accent/10 border-accent/20'
                : 'text-dim hover:text-ink bg-transparent border-transparent hover:bg-lift'
            }`}
          >
            <Settings size={13} />
            Controls
            <ChevronDown size={11} className={`transition-transform duration-150 ${menuOpen ? 'rotate-180' : ''}`} />
          </button>

          {menuOpen && (
            <div
              className="absolute left-0 top-full mt-2 z-50 w-64 bg-canvas border border-edge rounded-[10px] p-3 shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
              onClick={e => e.stopPropagation()}
            >
              {cmdError && (
                <div className="mb-2.5 px-2.5 py-1.5 rounded text-[0.75rem] bg-danger/[12%] text-danger border border-danger/30">
                  {cmdError}
                </div>
              )}

              {/* Power */}
              <div className="flex gap-1.5 mb-2.5">
                <button
                  onClick={() => sendCmd('start')}
                  disabled={!!cmdLoading || status === 'running'}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium rounded-md border bg-success/[12%] text-success border-success/30 hover:bg-success/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all duration-150"
                >
                  {cmdLoading === 'start' ? <Spinner /> : <Play size={11} />}
                  Start
                </button>
                <button
                  onClick={() => sendCmd('stop', { reason: 'Manual stop by operator' })}
                  disabled={!!cmdLoading || status === 'stopped'}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium rounded-md border bg-danger/[12%] text-danger border-danger/30 hover:bg-danger/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all duration-150"
                >
                  {cmdLoading === 'stop' ? <Spinner /> : <Square size={11} />}
                  Stop
                </button>
              </div>

              <div className="h-px bg-edge mb-2.5" />

              {/* Blade pitch */}
              <div className="flex gap-1.5 items-center mb-2">
                <label className="text-[0.7rem] text-faint w-[52px] shrink-0">Pitch (°)</label>
                <input
                  type="number"
                  value={pitchVal}
                  onChange={e => setPitchVal(e.target.value)}
                  min="0" max="30" step="1"
                  onClick={e => e.stopPropagation()}
                  className="flex-1 bg-card border border-edge rounded-md text-ink text-xs px-2 py-1 outline-none focus:border-accent transition-colors duration-150"
                />
                <button
                  onClick={() => {
                    const a = parseFloat(pitchVal);
                    if (isNaN(a) || a < 0 || a > 30) { setCmdError('Pitch must be 0–30°'); return; }
                    sendCmd('setPitch', { angle: a });
                  }}
                  disabled={!!cmdLoading}
                  className="shrink-0 flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md border bg-card text-dim border-edge hover:bg-lift hover:text-ink disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all duration-150"
                >
                  {cmdLoading === 'setPitch' ? <Spinner /> : <Sliders size={11} />}
                  Set
                </button>
              </div>

              {/* Telemetry interval */}
              <div className="flex gap-1.5 items-center">
                <label className="text-[0.7rem] text-faint w-[52px] shrink-0">Interval (s)</label>
                <input
                  type="number"
                  value={intervalSec}
                  onChange={e => setIntervalSec(e.target.value)}
                  min="1" max="60" step="1"
                  onClick={e => e.stopPropagation()}
                  className="flex-1 bg-card border border-edge rounded-md text-ink text-xs px-2 py-1 outline-none focus:border-accent transition-colors duration-150"
                />
                <button
                  onClick={() => {
                    const v = parseInt(intervalSec);
                    if (isNaN(v) || v < 1 || v > 60) { setCmdError('Interval must be 1–60s'); return; }
                    sendCmd('setInterval', { value: v });
                  }}
                  disabled={!!cmdLoading}
                  className="shrink-0 flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md border bg-card text-dim border-edge hover:bg-lift hover:text-ink disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all duration-150"
                >
                  {cmdLoading === 'setInterval' ? <Spinner /> : <Clock size={11} />}
                  Set
                </button>
              </div>
            </div>
          )}
        </div>

        <span className="text-[0.8rem] text-accent flex items-center gap-1">
          View details <ArrowRight size={13} />
        </span>
      </div>
    </div>
  );
}

function MetricItem({ icon, label, value, unit, valueClass }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
  valueClass?: string;
}) {
  return (
    <div className="bg-canvas rounded-lg px-3 py-2.5">
      <div className="flex items-center gap-[5px] text-faint mb-[5px]">
        {icon}
        <span className="text-[0.72rem]">{label}</span>
      </div>
      <div className={`text-[1.05rem] font-bold tabular-nums ${valueClass ?? 'text-ink'}`}>
        {value}<span className="text-[0.72rem] text-dim ml-0.5">{unit}</span>
      </div>
    </div>
  );
}
