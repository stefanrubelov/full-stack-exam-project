import { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { type TurbineCommand, alertsApi } from '../api/apiClient';
import { TurbineAction, TurbineStatus } from '../generated-ts-client';
import { useTurbineCommand } from '../hooks/useTurbineCommand';
import { Play, Square, Sliders, Clock, History, Send, FlaskConical, Wrench } from 'lucide-react';

interface Props {
  turbineId: string;
  turbineStatus: TurbineStatus;
  onCommandSent: () => void;
  initialBladePitch?: number;
  initialTelemetryInterval?: number;
}

const sectionLabel = 'text-dim text-[0.72rem] uppercase tracking-[0.8px] mb-2.5 font-semibold';
const inputClass = 'w-full bg-canvas border border-edge rounded-md text-ink text-[0.85rem] px-3 py-[9px] outline-none focus:border-accent focus:shadow-[0_0_0_3px_rgba(56,189,248,0.15)] transition-[border-color,box-shadow] duration-150 placeholder:text-faint font-sans disabled:opacity-50 disabled:cursor-not-allowed';

function Spinner() {
  return <span className="inline-block w-3 h-3 rounded-full border-[1.5px] border-edge border-t-accent animate-spin shrink-0" />;
}

export default function TurbineControls({ turbineId, turbineStatus, onCommandSent, initialBladePitch, initialTelemetryInterval }: Props) {
  const [pitchValue, setPitchValue] = useState(() => initialBladePitch?.toFixed(0) ?? '15');
  const [intervalValue, setIntervalValue] = useState(() => initialTelemetryInterval?.toString() ?? '10');
  const initialPitch = useRef(initialBladePitch?.toFixed(0) ?? '15');
  const initialInterval = useRef(initialTelemetryInterval?.toString() ?? '10');
  const { loading, error, setError, send: sendCmd } = useTurbineCommand(turbineId);

  const send = (action: TurbineAction, params?: Record<string, unknown>, successMsg?: string) =>
    sendCmd(action, params, () => { onCommandSent(); if (successMsg) toast.success(successMsg); });

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <div className="px-3.5 py-2.5 rounded-md text-[0.85rem] bg-danger/[12%] text-danger border border-danger/30">
          {error}
        </div>
      )}

      {/* Power controls */}
      <div>
        <h4 className={sectionLabel}>Power Control</h4>
        <div className="flex gap-2">
          <button
            onClick={() => send(TurbineAction.Start, undefined, 'Turbine started')}
            disabled={!!loading || turbineStatus === TurbineStatus.Running}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-[5px] text-[0.8rem] font-medium rounded-md cursor-pointer border transition-all duration-150 bg-success/[12%] text-success border-success/30 hover:bg-success/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading === TurbineAction.Start ? <Spinner /> : <Play size={13} />}
            Start
          </button>
          <button
            onClick={() => send(TurbineAction.Stop, { reason: 'Manual stop by operator' }, 'Turbine stopped')}
            disabled={!!loading || turbineStatus === TurbineStatus.Stopped}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-[5px] text-[0.8rem] font-medium rounded-md cursor-pointer border transition-all duration-150 bg-danger/[12%] text-danger border-danger/30 hover:bg-danger/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading === TurbineAction.Stop ? <Spinner /> : <Square size={13} />}
            Stop
          </button>
          <button
            onClick={() => send(TurbineAction.Stop, { reason: 'Turbine taken offline for scheduled maintenance' }, 'Turbine taken offline for maintenance')}
            disabled={!!loading || turbineStatus === TurbineStatus.Stopped}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-[5px] text-[0.8rem] font-medium rounded-md cursor-pointer border transition-all duration-150 bg-warning/[12%] text-warning border-warning/30 hover:bg-warning/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading === TurbineAction.Stop ? <Spinner /> : <Wrench size={13} />}
            Maintenance
          </button>
        </div>
      </div>

      {/* Blade pitch + Telemetry interval */}
      <div className="flex gap-4">
        <div className="flex-1">
          <h4 className={sectionLabel}>Blade Pitch</h4>
          <div className="flex gap-2 items-start">
            <div className="flex-1">
              <input
                type="number"
                value={pitchValue}
                onChange={e => setPitchValue(e.target.value)}
                min="0"
                max="30"
                step="1"
                placeholder="0–30°"
                disabled={!!loading || turbineStatus !== TurbineStatus.Running}
                className={inputClass}
              />
              <div className="text-[0.7rem] text-faint mt-1">Range: 0° to 30°</div>
            </div>
            <button
              onClick={() => {
                const a = parseFloat(pitchValue);
                if (isNaN(a) || a < 0 || a > 30) { setError('Pitch angle must be 0–30°'); return; }
                send(TurbineAction.SetPitch, { angle: a }, `Blade pitch set to ${a}°`);
              }}
              disabled={!!loading || turbineStatus !== TurbineStatus.Running || pitchValue === initialPitch.current}
              className="shrink-0 h-10 flex items-center justify-center gap-1.5 px-3 text-[0.8rem] font-medium rounded-md cursor-pointer border transition-all duration-150 bg-card text-ink border-edge hover:bg-lift hover:border-edge-light disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading === TurbineAction.SetPitch ? <Spinner /> : <Sliders size={13} />}
              Set
            </button>
          </div>
        </div>

        <div className="w-px bg-edge self-stretch" />

        <div className="flex-1">
          <h4 className={sectionLabel}>Telemetry Interval</h4>
          <div className="flex gap-2 items-start">
            <div className="flex-1">
              <input
                type="number"
                value={intervalValue}
                onChange={e => setIntervalValue(e.target.value)}
                min="1"
                max="60"
                step="1"
                placeholder="1–60 s"
                disabled={!!loading || turbineStatus !== TurbineStatus.Running}
                className={inputClass}
              />
              <div className="text-[0.7rem] text-faint mt-1">Range: 1–60 seconds</div>
            </div>
            <button
              onClick={() => {
                const v = parseInt(intervalValue);
                if (isNaN(v) || v < 1 || v > 60) { setError('Interval must be 1–60 seconds'); return; }
                send(TurbineAction.SetInterval, { value: v }, `Telemetry interval set to ${v}s`);
              }}
              disabled={!!loading || turbineStatus !== TurbineStatus.Running || intervalValue === initialInterval.current}
              className="shrink-0 h-10 flex items-center justify-center gap-1.5 px-3 text-[0.8rem] font-medium rounded-md cursor-pointer border transition-all duration-150 bg-card text-ink border-edge hover:bg-lift hover:border-edge-light disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading === TurbineAction.SetInterval ? <Spinner /> : <Clock size={13} />}
              Set
            </button>
          </div>
        </div>
      </div>

      {import.meta.env.DEV && (
        <>
          <div className="h-px bg-edge" />
          <DevAlertTrigger turbineId={turbineId} />
        </>
      )}
    </div>
  );
}

function DevAlertTrigger({ turbineId }: { turbineId: string }) {
  const [loading, setLoading] = useState(false);
  const [last, setLast] = useState<string | null>(null);

  const trigger = async () => {
    setLoading(true);
    setLast(null);
    try {
      const alert = await alertsApi.triggerTest(turbineId);
      setLast(`[${alert.severity}] ${alert.message}`);
    } catch (e: any) {
      setLast(e?.message ?? 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <p className="text-[0.7rem] text-faint uppercase tracking-[0.8px] font-semibold mb-2">Dev Tools</p>
      <button
        onClick={trigger}
        disabled={loading}
        className="flex items-center gap-2 px-3 py-[5px] text-[0.8rem] font-medium rounded-md cursor-pointer border transition-all duration-150 bg-warning/[8%] text-warning border-warning/30 hover:bg-warning/15 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading
          ? <span className="inline-block w-3 h-3 rounded-full border-[1.5px] border-warning border-t-transparent animate-spin" />
          : <FlaskConical size={13} />}
        Trigger Test Alert
      </button>
      {last && <p className="mt-1.5 text-[0.72rem] text-faint truncate">{last}</p>}
    </div>
  );
}

export function CommandHistory({ commands }: { commands: TurbineCommand[] }) {
  if (commands.length === 0) {
    return (
      <div className="text-center py-10 px-6 text-faint">
        <History size={28} className="mx-auto" />
        <p>No commands issued yet</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {commands.map(cmd => {
        let payload: Record<string, unknown> = {};
        try { payload = JSON.parse(cmd.payload ?? '{}'); } catch { /* */ }

        return (
          <div
            key={cmd.id}
            className="flex items-start gap-2.5 px-3 py-2.5 bg-canvas rounded-lg border border-edge"
          >
            <Send size={13} color="#38bdf8" className="mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-[0.85rem] text-accent">{cmd.action}</span>
                {Object.entries(payload)
                  .filter(([k]) => k !== 'action')
                  .map(([k, v]) => (
                    <span key={k} className="text-xs text-dim">
                      {k}={String(v)}
                    </span>
                  ))}
              </div>
              <div className="flex gap-3 mt-0.5">
                <span className="text-[0.72rem] text-faint">by {cmd.userName}</span>
                <span className="text-[0.72rem] text-faint">{new Date(cmd.timestamp).toLocaleString()}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
