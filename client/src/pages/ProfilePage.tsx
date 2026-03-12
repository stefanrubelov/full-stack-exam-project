import { useState } from 'react';
import Layout from '../components/Layout';
import { profileApi } from '../api/apiClient';
import { useAuth } from '../contexts/useAuth';
import { User, KeyRound, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const inputClass = 'bg-canvas border border-edge rounded-md text-ink text-[0.85rem] px-3 py-[7px] outline-none focus:border-accent focus:shadow-[0_0_0_3px_rgba(13,27,42,0.12)] transition-[border-color,box-shadow] duration-150 placeholder:text-faint font-sans w-full';
const labelClass = 'text-[0.7rem] text-faint uppercase tracking-[0.7px] font-semibold';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();

  const [name, setName] = useState(user?.name ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const saveName = async () => {
    if (!name.trim() || name === user?.name) return;
    setSavingName(true);
    try {
      const updated = await profileApi.update({ name: name.trim() });
      updateUser(updated);
      toast.success('Name updated');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to update name');
    } finally {
      setSavingName(false);
    }
  };

  const savePassword = async () => {
    if (!currentPassword || !newPassword) { toast.error('Fill in all password fields'); return; }
    if (newPassword !== confirmPassword) { toast.error('New passwords do not match'); return; }
    setSavingPassword(true);
    try {
      await profileApi.update({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password updated');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to update password');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <Layout>
      <div className="px-4 py-5 lg:px-8 lg:py-7 max-w-[700px] w-full">
        <div className="mb-6">
          <div className="flex items-center gap-2.5 mb-1.5">
            <User size={22} className="text-ink" />
            <h1 className="text-[1.75rem] font-bold text-ink tracking-[-0.5px]">Profile</h1>
          </div>
          <p className="text-dim text-sm">Manage your account details</p>
        </div>

        {/* Name section */}
        <div className="bg-card border border-edge rounded-[10px] p-5 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <User size={16} className="text-accent" />
            <h2 className="text-[0.9rem] font-semibold text-ink">Display Name</h2>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className={labelClass}>Email</label>
              <input type="text" value={user?.email ?? ''} disabled className={`${inputClass} opacity-50 cursor-not-allowed`} />
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelClass}>Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveName()}
                placeholder="Your name"
                className={inputClass}
              />
            </div>
            <div>
              <button
                onClick={saveName}
                disabled={savingName || !name.trim() || name === user?.name}
                className="flex items-center gap-1.5 px-4 py-[8px] text-[0.8rem] font-semibold rounded-md bg-accent text-white border-none cursor-pointer transition-all duration-150 hover:bg-accent-dark disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check size={14} />
                {savingName ? 'Saving…' : 'Save name'}
              </button>
            </div>
          </div>
        </div>

        {/* Password section */}
        <div className="bg-card border border-edge rounded-[10px] p-5">
          <div className="flex items-center gap-2 mb-4">
            <KeyRound size={16} className="text-accent" />
            <h2 className="text-[0.9rem] font-semibold text-ink">Change Password</h2>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className={labelClass}>Current password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelClass}>New password</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelClass}>Confirm new password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && savePassword()}
                placeholder="••••••••"
                className={inputClass}
              />
            </div>
            <div>
              <button
                onClick={savePassword}
                disabled={savingPassword}
                className="flex items-center gap-1.5 px-4 py-[8px] text-[0.8rem] font-semibold rounded-md bg-accent text-white border-none cursor-pointer transition-all duration-150 hover:bg-accent-dark disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check size={14} />
                {savingPassword ? 'Saving…' : 'Save password'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
