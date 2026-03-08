import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { type TurbineCommand, type WindTurbine, type CommandsPage, commandsApi, turbinesApi } from '../api/apiClient';
import { Link } from 'react-router-dom';
import { Send, Terminal, RotateCcw } from 'lucide-react';
import Pagination from '../components/Pagination';

const PAGE_SIZE = 20;

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 10) return 'just now';
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  const h = Math.floor(s / 3600);
  if (h < 24) return `${h}h ago`;
  return new Date(iso).toLocaleDateString();
}

const actionColor: Record<string, string> = {
  start:       'text-success',
  stop:        'text-danger',
  setPitch:    'text-accent',
  setInterval: 'text-warning',
};

const inputClass = 'bg-canvas border border-edge rounded-md text-ink text-[0.85rem] px-3 py-[7px] outline-none focus:border-accent focus:shadow-[0_0_0_3px_rgba(56,189,248,0.15)] transition-[border-color,box-shadow] duration-150 placeholder:text-faint font-sans';

export default function CommandLogsPage() {
  const [result, setResult] = useState<CommandsPage>({ total: 0, page: 1, pageSize: PAGE_SIZE, items: [] });
  const [turbines, setTurbines] = useState<WindTurbine[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [turbineId, setTurbineId] = useState('');
  const [userName, setUserName] = useState('');

  const load = async (p: number) => {
    setLoading(true);
    try {
      const data = await commandsApi.getAll({
        from: from || undefined,
        to: to || undefined,
        turbineId: turbineId || undefined,
        userName: userName || undefined,
        page: p,
        pageSize: PAGE_SIZE,
      });
      setResult(data);
      setPage(p);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    turbinesApi.getAll().then(d => setTurbines(d.map(t => t.turbine))).catch(() => {});
    load(1);
  }, []);

  const apply = () => load(1);

  const reset = () => {
    setFrom(''); setTo(''); setTurbineId(''); setUserName('');
    // load with cleared filters directly
    setLoading(true);
    commandsApi.getAll({ page: 1, pageSize: PAGE_SIZE })
      .then(data => { setResult(data); setPage(1); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const totalPages = Math.ceil(result.total / PAGE_SIZE);
  const commands: TurbineCommand[] = result.items;

  return (
    <Layout>
      <div className="px-8 py-7 max-w-[1400px] w-full">
        <div className="mb-6">
          <div className="flex items-center gap-2.5 mb-1.5">
            <Terminal size={22} className="text-ink" />
            <h1 className="text-[1.75rem] font-bold text-ink tracking-[-0.5px]">Command Logs</h1>
          </div>
          <p className="text-dim text-sm">All commands issued to wind turbines</p>
        </div>

        {/* Filters */}
        <div className="bg-card border border-edge rounded-[10px] p-4 mb-5 flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-[0.7rem] text-faint uppercase tracking-[0.7px] font-semibold">From</label>
            <input type="datetime-local" value={from} onChange={e => setFrom(e.target.value)} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[0.7rem] text-faint uppercase tracking-[0.7px] font-semibold">To</label>
            <input type="datetime-local" value={to} onChange={e => setTo(e.target.value)} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[0.7rem] text-faint uppercase tracking-[0.7px] font-semibold">Turbine</label>
            <select value={turbineId} onChange={e => setTurbineId(e.target.value)} className={inputClass}>
              <option value="">All turbines</option>
              {turbines.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[0.7rem] text-faint uppercase tracking-[0.7px] font-semibold">User</label>
            <input
              type="text"
              value={userName}
              onChange={e => setUserName(e.target.value)}
              placeholder="Search by username…"
              className={inputClass}
              onKeyDown={e => e.key === 'Enter' && apply()}
            />
          </div>
          <button
            onClick={apply}
            className="flex items-center gap-1.5 px-4 py-[8px] text-[0.8rem] font-semibold rounded-md bg-accent text-surface border-none cursor-pointer transition-all duration-150 hover:bg-sky-300"
          >
            Apply
          </button>
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
          ) : commands.length === 0 ? (
            <div className="text-center py-14 px-6 text-faint">
              <Terminal size={32} className="mx-auto opacity-40 mb-2" />
              <p className="text-dim font-semibold">No commands found</p>
              <p className="text-sm">Try adjusting the filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[0.85rem]">
                <thead>
                  <tr className="border-b border-edge text-left">
                    <th className="px-4 py-3 text-[0.72rem] text-faint uppercase tracking-[0.7px] font-semibold">Time</th>
                    <th className="px-4 py-3 text-[0.72rem] text-faint uppercase tracking-[0.7px] font-semibold">Turbine</th>
                    <th className="px-4 py-3 text-[0.72rem] text-faint uppercase tracking-[0.7px] font-semibold">Action</th>
                    <th className="px-4 py-3 text-[0.72rem] text-faint uppercase tracking-[0.7px] font-semibold">Parameters</th>
                    <th className="px-4 py-3 text-[0.72rem] text-faint uppercase tracking-[0.7px] font-semibold">User</th>
                  </tr>
                </thead>
                <tbody>
                  {commands.map((cmd, i) => {
                    let payload: Record<string, unknown> = {};
                    try { payload = JSON.parse(cmd.payload ?? '{}'); } catch { /* */ }
                    const params = Object.entries(payload).filter(([k]) => k !== 'action');
                    const turbine = turbines.find(t => t.id === cmd.turbineId);

                    return (
                      <tr key={cmd.id} className={`border-b border-edge last:border-0 ${i % 2 === 0 ? '' : 'bg-canvas/40'}`}>
                        <td className="px-4 py-3 text-ink/60 whitespace-nowrap">
                          <div>{timeAgo(cmd.timestamp)}</div>
                          <div className="text-[0.72rem] text-faint">{new Date(cmd.timestamp).toLocaleString()}</div>
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            to={`/turbines/${cmd.turbineId}`}
                            className="flex items-center gap-2 no-underline hover:text-accent transition-colors duration-150 w-fit"
                            onClick={e => e.stopPropagation()}
                          >
                            <Send size={12} color="#38bdf8" className="shrink-0" />
                            <span className="text-ink font-medium hover:text-accent">{turbine?.name ?? `…${cmd.turbineId.slice(-8)}`}</span>
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`font-semibold ${actionColor[cmd.action] ?? 'text-ink'}`}>{cmd.action}</span>
                        </td>
                        <td className="px-4 py-3 text-dim">
                          {params.length === 0 ? (
                            <span className="text-faint">—</span>
                          ) : (
                            params.map(([k, v]) => (
                              <span key={k} className="mr-3">{k}=<span className="text-ink">{String(v)}</span></span>
                            ))
                          )}
                        </td>
                        <td className="px-4 py-3 text-ink/70">{cmd.userName}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {result.total > 0 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-[0.75rem] text-faint">
              {result.total.toLocaleString()} result{result.total !== 1 ? 's' : ''} · page {page} of {totalPages}
            </p>
            <Pagination page={page} totalPages={totalPages} onPageChange={load} disabled={loading} />
          </div>
        )}
      </div>
    </Layout>
  );
}
