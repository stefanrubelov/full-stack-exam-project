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
      isActive ? 'bg-accent/15 text-accent' : 'text-dim hover:bg-lift hover:text-ink'
    }`;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <nav className="flex flex-col w-[220px] h-screen sticky top-0 bg-canvas border-r border-edge shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 py-5 border-b border-edge">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-sky-500 to-accent flex items-center justify-center shrink-0">
            <Wind size={20} color="#0b1120" />
          </div>
          <div>
            <div className="font-bold text-[0.95rem] text-ink">WindWatch</div>
            <div className="text-[0.72rem] text-faint">Farm Monitor</div>
          </div>
        </div>

        {/* Nav links */}
        <div className="flex-1 py-3">
          <div className="px-4 pb-2 text-[0.7rem] text-faint uppercase tracking-[0.8px]">
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

          <div className="px-4 pb-2 pt-4 text-[0.7rem] text-faint uppercase tracking-[0.8px]">
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
        <div className="p-2 border-t border-edge">
          <NavLink to="/profile" className={({ isActive }) =>
            `flex items-center gap-2.5 px-4 py-2.5 rounded-md no-underline transition-all duration-150 mx-0 ${isActive ? 'bg-accent/15' : 'hover:bg-lift'}`
          }>
            <div className="w-7 h-7 rounded-full bg-accent/15 border border-accent flex items-center justify-center shrink-0">
              <User size={14} color="#38bdf8" />
            </div>
            <div className="overflow-hidden">
              <div className="text-[0.82rem] font-semibold text-ink whitespace-nowrap overflow-hidden text-ellipsis">
                {user?.name}
              </div>
              <div className="text-[0.7rem] text-faint whitespace-nowrap overflow-hidden text-ellipsis">
                {user?.email}
              </div>
            </div>
          </NavLink>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 w-full px-4 py-2.5 rounded-md text-sm font-medium text-dim bg-transparent border-none cursor-pointer transition-all duration-150 hover:bg-danger/[12%] hover:text-danger mt-1"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 overflow-auto flex flex-col">
        {children}
      </main>
    </div>
  );
}
