import { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { RefreshCw } from 'lucide-react';
import { type MetricHistoryPoint, turbinesApi } from '../api/apiClient';

interface HistoryMetricConfig {
  key: keyof Omit<MetricHistoryPoint, 'period' | 'dataPoints'>;
  label: string;
  unit: string;
  color: string;
}

const HISTORY_METRICS: HistoryMetricConfig[] = [
  { key: 'windSpeed',          label: 'Wind Speed',      unit: 'm/s', color: '#38bdf8' },
  { key: 'powerOutput',        label: 'Power Output',    unit: 'W',   color: '#22c55e' },
  { key: 'rotorSpeed',         label: 'Rotor Speed',     unit: 'rpm', color: '#a78bfa' },
  { key: 'bladePitch',         label: 'Blade Pitch',     unit: '°',   color: '#f59e0b' },
  { key: 'generatorTemp',      label: 'Generator Temp',  unit: '°C',  color: '#ef4444' },
  { key: 'gearboxTemp',        label: 'Gearbox Temp',    unit: '°C',  color: '#fb923c' },
  { key: 'vibration',          label: 'Vibration',       unit: '',    color: '#ec4899' },
  { key: 'ambientTemperature', label: 'Ambient Temp',    unit: '°C',  color: '#34d399' },
];

const GRANULARITIES = [
  { value: 'day',     label: 'Daily' },
  { value: 'week',    label: 'Weekly' },
  { value: 'month',   label: 'Monthly' },
  { value: 'quarter', label: 'Quarterly' },
  { value: 'year',    label: 'Yearly' },
];

function toDateInputValue(d: Date) {
  return d.toISOString().slice(0, 10);
}

const CustomTooltip = ({ active, payload, label, unit }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-edge rounded-md px-3 py-2 text-[0.8rem]">
      <p className="text-dim mb-1">{label}</p>
      <p style={{ color: payload[0].color }} className="font-semibold">
        {typeof payload[0].value === 'number' ? payload[0].value.toFixed(2) : payload[0].value}
        {unit ? ` ${unit}` : ''}
      </p>
      {payload[0].payload?.dataPoints != null && (
        <p className="text-faint mt-0.5">{payload[0].payload.dataPoints} readings</p>
      )}
    </div>
  );
};

export default function MetricsHistoryTab({ turbineId }: { turbineId: string }) {
  const defaultTo = new Date();
  const defaultFrom = new Date();
  defaultFrom.setDate(defaultFrom.getDate() - 30);

  const [from, setFrom] = useState(toDateInputValue(defaultFrom));
  const [to, setTo] = useState(toDateInputValue(defaultTo));
  const [granularity, setGranularity] = useState('day');
  const [data, setData] = useState<MetricHistoryPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await turbinesApi.getMetricsHistory(turbineId, from, to, granularity);
      setData(result);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load history');
    } finally {
      setLoading(false);
    }
  }, [turbineId, from, to, granularity]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  return (
    <div>
      {/* Filter bar */}
      <div className="bg-card border border-edge rounded-[10px] p-4 mb-5 flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-faint font-medium">From</label>
          <input
            type="date"
            value={from}
            onChange={e => setFrom(e.target.value)}
            className="bg-base border border-edge rounded-md px-3 py-[6px] text-sm text-ink focus:outline-none focus:border-accent transition-colors"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-faint font-medium">To</label>
          <input
            type="date"
            value={to}
            onChange={e => setTo(e.target.value)}
            className="bg-base border border-edge rounded-md px-3 py-[6px] text-sm text-ink focus:outline-none focus:border-accent transition-colors"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-faint font-medium">Granularity</label>
          <select
            value={granularity}
            onChange={e => setGranularity(e.target.value)}
            className="bg-base border border-edge rounded-md px-3 py-[6px] text-sm text-ink focus:outline-none focus:border-accent transition-colors cursor-pointer"
          >
            {GRANULARITIES.map(g => (
              <option key={g.value} value={g.value}>{g.label}</option>
            ))}
          </select>
        </div>
        <button
          onClick={fetchHistory}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-[7px] text-sm font-medium rounded-md border border-edge bg-lift text-ink hover:bg-card hover:border-edge-light transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
        {data.length > 0 && (
          <span className="ml-auto text-xs text-faint self-end pb-[7px]">
            {data.length} period{data.length !== 1 ? 's' : ''} · avg per period
          </span>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-danger/10 border border-danger/30 text-danger rounded-[10px] px-4 py-3 text-sm mb-5">
          {error}
        </div>
      )}

      {/* Charts */}
      {loading && data.length === 0 ? (
        <div className="flex justify-center items-center py-16">
          <span className="inline-block w-7 h-7 rounded-full border-2 border-edge border-t-accent animate-spin" />
        </div>
      ) : data.length === 0 ? (
        <div className="text-center py-16 text-faint text-sm">
          No data found for the selected period.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {HISTORY_METRICS.map(cfg => (
            <HistoryChart key={cfg.key} data={data} config={cfg} />
          ))}
        </div>
      )}
    </div>
  );
}

function HistoryChart({ data, config }: { data: MetricHistoryPoint[]; config: HistoryMetricConfig }) {
  const chartData = data.map(p => ({
    period: p.period,
    value: p[config.key] as number,
    dataPoints: p.dataPoints,
  }));

  return (
    <div className="bg-card border border-edge rounded-[10px] px-5 py-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: config.color }} />
        <h4 className="font-semibold text-ink">{config.label}</h4>
        {config.unit && <span className="ml-auto text-xs text-faint">{config.unit}</span>}
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={chartData} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a3a52" />
          <XAxis
            dataKey="period"
            tick={{ fill: '#4d6280', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: '#4d6280', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <Tooltip content={<CustomTooltip unit={config.unit} />} />
          <Line
            type="monotone"
            dataKey="value"
            stroke={config.color}
            strokeWidth={2}
            dot={chartData.length <= 20 ? { r: 3, fill: config.color, strokeWidth: 0 } : false}
            activeDot={{ r: 4, fill: config.color }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
