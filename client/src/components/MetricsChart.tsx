import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { type TurbineMetric } from '../api/apiClient';

interface MetricConfig {
  key: keyof TurbineMetric;
  label: string;
  unit: string;
  color: string;
}

interface Props {
  metrics: TurbineMetric[];
  config: MetricConfig;
  height?: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-edge rounded-md px-3 py-2 text-[0.8rem]">
      <p className="text-dim mb-1">{label}</p>
      <p style={{ color: payload[0].color }} className="font-semibold">
        {typeof payload[0].value === 'number' ? payload[0].value.toFixed(2) : payload[0].value}
        {' '}{payload[0].name}
      </p>
    </div>
  );
};

export default function MetricsChart({ metrics, config, height = 200 }: Props) {
  // Metrics come in descending order from API, reverse for chart
  const chartData = [...metrics].reverse().map(m => ({
    time: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    value: m[config.key] as number,
  }));

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center text-faint text-[0.85rem]" style={{ height }}>
        No data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E0DDD6" />
        <XAxis
          dataKey="time"
          tick={{ fill: '#9BA3AF', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: '#9BA3AF', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          width={40}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="value"
          name={config.unit}
          stroke={config.color}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: config.color }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export type { MetricConfig };
