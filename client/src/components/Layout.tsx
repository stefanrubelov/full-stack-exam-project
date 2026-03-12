import { type ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';
import { LayoutDashboard, Wind, Bell, LogOut, User, Terminal, Users, ShieldAlert, Wrench } from 'lucide-react';

interface Props {
  alertCount?: number;
  children: ReactNode;
}

export default function Layout({ children, alertCount = 0 }: Props) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2.5 px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-150 mx-2 no-underline ${
      isActive
        ? 'bg-white/10 text-white'
        : 'text-[#8ea4c4] hover:bg-white/[6%] hover:text-white'
    }`;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <nav className="flex flex-col w-[220px] h-screen sticky top-0 shrink-0 bg-[#0D1B2A] border-r border-[#1a2d42]">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 py-5 border-b border-[#1a2d42]">
          <div className="w-9 h-9 rounded-lg bg-[#1a2d42] border border-[#2a3d52] flex items-center justify-center shrink-0">
            <Wind size={20} color="#8ea4c4" />
          </div>
          <div>
            <div className="font-bold text-[0.95rem] text-white">WindWatch</div>
            <div className="text-[0.72rem] text-[#4d6280]">Farm Monitor</div>
          </div>
        </div>

        {/* Nav links */}
        <div className="flex-1 py-3">
          <div className="px-4 pb-2 text-[0.7rem] text-[#4d6280] uppercase tracking-[0.8px]">
            Navigation
          </div>

          <NavLink to="/dashboard" className={navLinkClass}>
            <LayoutDashboard size={17} />
            Dashboard
          </NavLink>

          <NavLink to="/alerts" className={navLinkClass}>
            <Bell size={17} />
            Alerts
            {alertCount > 0 && (
              <span className="ml-auto bg-danger text-white text-[0.7rem] font-bold rounded-[10px] px-1.5 py-px min-w-[20px] text-center">
                {alertCount > 99 ? '99+' : alertCount}
              </span>
            )}
          </NavLink>

          <NavLink to="/command-logs" className={navLinkClass}>
            <Terminal size={17} />
            Command Logs
          </NavLink>
          <NavLink to="/maintenance" className={navLinkClass}>
            <Wrench size={17} />
            Maintenance
          </NavLink>

          <div className="px-4 pb-2 pt-4 text-[0.7rem] text-[#4d6280] uppercase tracking-[0.8px]">
            Admin
          </div>

          <NavLink to="/users" className={navLinkClass}>
            <Users size={17} />
            Users
          </NavLink>

          <NavLink to="/alert-thresholds" className={navLinkClass}>
            <ShieldAlert size={17} />
            Alert Thresholds
          </NavLink>
        </div>

        {/* User section */}
        <div className="p-2 border-t border-[#1a2d42]">
          <NavLink to="/profile" className={({ isActive }) =>
            `flex items-center gap-2.5 px-4 py-2.5 rounded-md no-underline transition-all duration-150 mx-0 ${isActive ? 'bg-white/10' : 'hover:bg-white/[6%]'}`
          }>
            <div className="w-7 h-7 rounded-full bg-[#1a2d42] border border-[#2a3d52] flex items-center justify-center shrink-0">
              <User size={14} color="#8ea4c4" />
            </div>
            <div className="overflow-hidden">
              <div className="text-[0.82rem] font-semibold text-white whitespace-nowrap overflow-hidden text-ellipsis">
                {user?.name}
              </div>
              <div className="text-[0.7rem] text-[#4d6280] whitespace-nowrap overflow-hidden text-ellipsis">
                {user?.email}
              </div>
            </div>
          </NavLink>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 w-full px-4 py-2.5 rounded-md text-sm font-medium text-[#8ea4c4] bg-transparent border-none cursor-pointer transition-all duration-150 hover:bg-danger/[12%] hover:text-danger mt-1"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 overflow-auto flex flex-col bg-surface">
        {children}
      </main>
    </div>
  );
}
