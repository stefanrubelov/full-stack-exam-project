import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { type AppUser, type UsersPage, usersApi } from '../api/apiClient';
import { Users, RotateCcw } from 'lucide-react';
import Pagination from '../components/Pagination';

const PAGE_SIZE = 20;

const inputClass = 'bg-canvas border border-edge rounded-md text-ink text-[0.85rem] px-3 py-[7px] outline-none focus:border-accent focus:shadow-[0_0_0_3px_rgba(56,189,248,0.15)] transition-[border-color,box-shadow] duration-150 placeholder:text-faint font-sans';

export default function UsersPage() {
  const [result, setResult] = useState<UsersPage>({ total: 0, page: 1, pageSize: PAGE_SIZE, items: [] });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const load = async (p: number, q = search) => {
    setLoading(true);
    try {
      const data = await usersApi.getAll({ page: p, pageSize: PAGE_SIZE, search: q || undefined });
      setResult(data);
      setPage(p);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(1); }, []);

  const apply = () => load(1);

  const reset = () => {
    setSearch('');
    load(1, '');
  };

  const totalPages = Math.ceil(result.total / PAGE_SIZE);
  const users: AppUser[] = result.items;

  return (
    <Layout>
      <div className="px-8 py-7 max-w-[1400px] w-full">
        <div className="mb-6">
          <div className="flex items-center gap-2.5 mb-1.5">
            <Users size={22} className="text-ink" />
            <h1 className="text-[1.75rem] font-bold text-ink tracking-[-0.5px]">Users</h1>
          </div>
          <p className="text-dim text-sm">All registered accounts</p>
        </div>

        {/* Search */}
        <div className="bg-card border border-edge rounded-[10px] p-4 mb-5 flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-[0.7rem] text-faint uppercase tracking-[0.7px] font-semibold">Search</label>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && apply()}
              placeholder="Name or email…"
              className={inputClass}
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
          ) : users.length === 0 ? (
            <div className="text-center py-14 px-6 text-faint">
              <Users size={32} className="mx-auto opacity-40 mb-2" />
              <p className="text-dim font-semibold">No users found</p>
            </div>
          ) : (
            <table className="w-full text-[0.85rem]">
              <thead>
                <tr className="border-b border-edge text-left">
                  <th className="px-4 py-3 text-[0.72rem] text-faint uppercase tracking-[0.7px] font-semibold">Name</th>
                  <th className="px-4 py-3 text-[0.72rem] text-faint uppercase tracking-[0.7px] font-semibold">Email</th>
                  <th className="px-4 py-3 text-[0.72rem] text-faint uppercase tracking-[0.7px] font-semibold">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr key={u.id} className={`border-b border-edge last:border-0 ${i % 2 === 0 ? '' : 'bg-canvas/40'}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center shrink-0 text-accent text-[0.75rem] font-bold">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-ink font-medium">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-dim">{u.email}</td>
                    <td className="px-4 py-3 text-ink/60">{new Date(u.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {result.total > 0 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-[0.75rem] text-faint">
              {result.total.toLocaleString()} user{result.total !== 1 ? 's' : ''} · page {page} of {totalPages}
            </p>
            <Pagination page={page} totalPages={totalPages} onPageChange={load} disabled={loading} />
          </div>
        )}
      </div>
    </Layout>
  );
}
