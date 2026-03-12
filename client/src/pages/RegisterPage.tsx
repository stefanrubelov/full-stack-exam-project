import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../api/apiClient';
import { Wind, UserPlus } from 'lucide-react';

const inputClass = 'w-full bg-canvas border border-edge rounded-md text-ink text-sm px-3 py-[9px] outline-none focus:border-accent focus:shadow-[0_0_0_3px_rgba(13,27,42,0.12)] transition-[border-color,box-shadow] duration-150 placeholder:text-faint font-sans';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await authApi.register(name, email, password, confirmPassword);
      navigate('/login');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-6">

      <div className="w-full max-w-[400px]">
        {/* Logo */}
        <div className="text-center mb-9">
          <div className="w-14 h-14 rounded-[14px] bg-[#0D1B2A] flex items-center justify-center mx-auto mb-4 shadow-[0_4px_16px_rgba(13,27,42,0.2)]">
            <Wind size={28} color="#8ea4c4" />
          </div>
          <h1 className="text-2xl font-bold text-ink">WindWatch</h1>
          <p className="text-dim mt-1 text-sm">Offshore Wind Farm Monitor</p>
        </div>

        {/* Card */}
        <div className="bg-card border border-edge rounded-[10px] px-8 py-7">
          <h2 className="mb-6 text-[1.1rem] font-semibold text-ink">Create an account</h2>

          {error && (
            <div className="px-3.5 py-2.5 rounded-md text-[0.85rem] bg-danger/[12%] text-danger border border-danger/30 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="name" className="text-[0.8rem] font-medium text-dim tracking-[0.3px]">
                Full name
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="John Smith"
                required
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-[0.8rem] font-medium text-dim tracking-[0.3px]">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-[0.8rem] font-medium text-dim tracking-[0.3px]">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                required
                minLength={8}
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="confirmPassword" className="text-[0.8rem] font-medium text-dim tracking-[0.3px]">
                Confirm password
              </label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repeat your password"
                required
                className={inputClass}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-1 flex items-center justify-center gap-1.5 px-5 py-[11px] text-[0.9rem] font-semibold rounded-md bg-accent text-white cursor-pointer border-none transition-all duration-150 hover:bg-accent-dark disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? <span className="inline-block w-[18px] h-[18px] rounded-full border-2 border-white/40 border-t-white animate-spin shrink-0" />
                : <UserPlus size={16} />
              }
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="text-center mt-5 text-dim text-sm">
          Already have an account?{' '}
          <Link to="/login" className="text-accent font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
