import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { type AlertThreshold, alertThresholdsApi } from '../api/apiClient';
import { ShieldAlert, Check, X, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';

const severityBadge: Record<string, string> = {
  critical: 'bg-danger/15 text-danger border border-danger/30',
  warning: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
};

export default function AlertThresholdsPage() {
  const [thresholds, setThresholds] = useState<AlertThreshold[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await alertThresholdsApi.getAll();
      setThresholds(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const startEdit = (t: AlertThreshold) => {
    setEditing(t.id);
    setEditValue(String(t.value));
  };

  const cancelEdit = () => {
    setEditing(null);
    setEditValue('');
  };

  const save = async (t: AlertThreshold) => {
    const num = parseFloat(editValue);
    if (isNaN(num)) { toast.error('Invalid value'); return; }
    setSaving(true);
    try {
      const updated = await alertThresholdsApi.update(t.id, { value: num });
      setThresholds(prev => prev.map(x => x.id === t.id ? updated : x));
      setEditing(null);
      toast.success('Threshold updated');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const toggleEnabled = async (t: AlertThreshold) => {
    try {
      const updated = await alertThresholdsApi.update(t.id, { isEnabled: !t.isEnabled });
      setThresholds(prev => prev.map(x => x.id === t.id ? updated : x));
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to update');
    }
  };

  return (
    <Layout>
      <div className="px-4 py-5 lg:px-8 lg:py-7 max-w-[1400px] w-full">
        <div className="mb-6">
          <div className="flex items-center gap-2.5 mb-1.5">
            <ShieldAlert size={22} className="text-ink" />
            <h1 className="text-[1.75rem] font-bold text-ink tracking-[-0.5px]">Alert Thresholds</h1>
          </div>
          <p className="text-dim text-sm">Configure when alerts are triggered for each metric</p>
        </div>

        <div className="bg-card border border-edge rounded-[10px] overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <span className="inline-block w-7 h-7 rounded-full border-2 border-edge border-t-accent animate-spin" />
            </div>
          ) : thresholds.length === 0 ? (
            <div className="text-center py-14 px-6 text-faint">
              <ShieldAlert size={32} className="mx-auto opacity-40 mb-2" />
              <p className="text-dim font-semibold">No thresholds configured</p>
            </div>
          ) : (
            <table className="w-full text-[0.85rem]">
              <thead>
                <tr className="border-b border-edge text-left">
                  <th className="px-4 py-3 text-[0.72rem] text-faint uppercase tracking-[0.7px] font-semibold">Metric</th>
                  <th className="px-4 py-3 text-[0.72rem] text-faint uppercase tracking-[0.7px] font-semibold">Description</th>
                  <th className="px-4 py-3 text-[0.72rem] text-faint uppercase tracking-[0.7px] font-semibold">Severity</th>
                  <th className="px-4 py-3 text-[0.72rem] text-faint uppercase tracking-[0.7px] font-semibold">Threshold</th>
                  <th className="px-4 py-3 text-[0.72rem] text-faint uppercase tracking-[0.7px] font-semibold">Enabled</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {thresholds.map((t, i) => (
                  <tr key={t.id} className={`border-b border-edge last:border-0 ${i % 2 === 0 ? '' : 'bg-canvas/40'}`}>
                    <td className="px-4 py-3 text-ink font-mono">{t.metricName}</td>
                    <td className="px-4 py-3 text-dim">{t.description}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[0.72rem] font-semibold px-2 py-0.5 rounded-full ${severityBadge[t.severity] ?? 'bg-edge text-dim'}`}>
                        {t.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {editing === t.id ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') save(t); if (e.key === 'Escape') cancelEdit(); }}
                            className="w-20 bg-canvas border border-accent rounded px-2 py-1 text-ink text-[0.85rem] outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() => save(t)}
                            disabled={saving}
                            className="p-1 rounded hover:bg-accent/15 text-accent transition-colors cursor-pointer border-none bg-transparent disabled:opacity-50"
                          >
                            <Check size={15} />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="p-1 rounded hover:bg-lift text-dim transition-colors cursor-pointer border-none bg-transparent"
                          >
                            <X size={15} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-ink font-semibold">{t.value}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleEnabled(t)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 border-none cursor-pointer ${t.isEnabled ? 'bg-accent' : 'bg-edge'}`}
                      >
                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-200 ${t.isEnabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      {editing !== t.id && (
                        <button
                          onClick={() => startEdit(t)}
                          className="p-1.5 rounded hover:bg-lift text-dim hover:text-ink transition-colors cursor-pointer border-none bg-transparent"
                        >
                          <Pencil size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Layout>
  );
}
