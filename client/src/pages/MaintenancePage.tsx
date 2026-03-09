import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { type MaintenancePeriod, type WindTurbine, maintenanceApi, turbinesApi } from '../api/apiClient';
import { Wrench, RotateCcw } from 'lucide-react';
import Pagination from '../components/Pagination';

const PAGE_SIZE = 20;

function duration(minutes: number | null): string {
  if (minutes === null) return '—';
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default function MaintenancePage() {
  const [result, setResult] = useState<{ total: number; page: number; pageSize: number; items: MaintenancePeriod[] }>({
    total: 0, page: 1, pageSize: PAGE_SIZE, items: [],
  });
  const [turbines, setTurbines] = useState<WindTurbine[]>([]);
  const [turbineFilter, setTurbineFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const load = async (p: number, tid = turbineFilter) => {
    setLoading(true);
    try {
      const data = await maintenanceApi.getAll({ page: p, pageSize: PAGE_SIZE, turbineId: tid || undefined });
      setResult(data);
      setPage(p);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    turbinesApi.getAll().then(list => setTurbines(list.map(s => s.turbine)));
    load(1);
  }, []);

  const reset = () => {
    setTurbineFilter('');
    load(1, '');
  };

  const totalPages = Math.ceil(result.total / PAGE_SIZE);
  const records = result.items;

  return (
    <Layout>
      <div className="px-8 py-7 max-w-[1400px] w-full">
        <div className="mb-6">
          <div className="flex items-center gap-2.5 mb-1.5">
            <Wrench size={22} className="text-ink" />
            <h1 className="text-[1.75rem] font-bold text-ink tracking-[-0.5px]">Maintenance Log</h1>
          </div>
          <p className="text-dim text-sm">History of maintenance periods derived from stop/start commands</p>
        </div>

        {/* Filters */}
        <div className="bg-card border border-edge rounded-[10px] p-4 mb-5 flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-[0.7rem] text-faint uppercase tracking-[0.7px] font-semibold">Turbine</label>
            <select
              value={turbineFilter}
              onChange={e => { setTurbineFilter(e.target.value); load(1, e.target.value); }}
              className="bg-canvas border border-edge rounded-md text-ink text-[0.85rem] px-3 py-[7px] outline-none focus:border-accent transition-[border-color] duration-150 font-sans"
            >
              <option value="">All turbines</option>
              {turbines.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <button
            onClick={reset}
            className="flex items-center gap-1.5 px-3 py-[8px] text-[0.8rem] font-medium rounded-md bg-card text-dim border border-edge cursor-pointer transition-all duration-150 hover:bg-lift"
          >
            <RotateCcw size={13} />
            Reset
          </button>
        </div>

        {/* Table */}
        <div className="bg-card border border-edge rounded-[10px] overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <span className="inline-block w-7 h-7 rounded-full border-2 border-edge border-t-accent animate-spin" />
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-14 px-6 text-faint">
              <Wrench size={32} className="mx-auto opacity-40 mb-2" />
              <p className="text-dim font-semibold">No maintenance records found</p>
            </div>
          ) : (
            <table className="w-full text-[0.85rem]">
              <thead>
                <tr className="border-b border-edge text-left">
                  <th className="px-4 py-3 text-[0.72rem] text-faint uppercase tracking-[0.7px] font-semibold">Turbine</th>
                  <th className="px-4 py-3 text-[0.72rem] text-faint uppercase tracking-[0.7px] font-semibold">Started</th>
                  <th className="px-4 py-3 text-[0.72rem] text-faint uppercase tracking-[0.7px] font-semibold">Ended</th>
                  <th className="px-4 py-3 text-[0.72rem] text-faint uppercase tracking-[0.7px] font-semibold">Duration</th>
                  <th className="px-4 py-3 text-[0.72rem] text-faint uppercase tracking-[0.7px] font-semibold">Triggered by</th>
                  <th className="px-4 py-3 text-[0.72rem] text-faint uppercase tracking-[0.7px] font-semibold">Resumed by</th>
                  <th className="px-4 py-3 text-[0.72rem] text-faint uppercase tracking-[0.7px] font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => (
                  <tr key={`${r.turbineId}-${r.startedAt}`} className={`border-b border-edge last:border-0 ${i % 2 === 0 ? '' : 'bg-canvas/40'}`}>
                    <td className="px-4 py-3 text-ink font-medium">{r.turbineName}</td>
                    <td className="px-4 py-3 text-dim">{new Date(r.startedAt).toLocaleString()}</td>
                    <td className="px-4 py-3 text-dim">{r.endedAt ? new Date(r.endedAt).toLocaleString() : '—'}</td>
                    <td className="px-4 py-3 text-ink">{duration(r.durationMinutes)}</td>
                    <td className="px-4 py-3 text-dim">{r.triggeredBy}</td>
                    <td className="px-4 py-3 text-dim">{r.resumedBy ?? '—'}</td>
                    <td className="px-4 py-3">
                      {r.endedAt ? (
                        <span className="text-[0.72rem] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          Completed
                        </span>
                      ) : (
                        <span className="text-[0.72rem] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                          In progress
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {result.total > 0 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-[0.75rem] text-faint">
              {result.total.toLocaleString()} record{result.total !== 1 ? 's' : ''} · page {page} of {totalPages}
            </p>
            <Pagination page={page} totalPages={totalPages} onPageChange={load} disabled={loading} />
          </div>
        )}
      </div>
    </Layout>
  );
}
