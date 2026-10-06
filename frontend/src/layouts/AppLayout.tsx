import { useState, useEffect } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Map,
  AlertTriangle,
  Route,
  Bell,
  Shield,
  LogOut,
  Menu,
  X,
  User,
  Siren,
  PlusCircle,
  Users,
  ChevronRight,
  Sparkles,
  Radio,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUnreadNotificationCount } from '@/hooks/useNotifications';
import { useIncidents } from '@/hooks/useIncidents';
import { Avatar, Button } from '@/components/ui';
import { cn } from '@/utils';
import { format } from 'date-fns';

interface NavSection {
  title: string;
  items: Array<{
    to: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string | number;
    badgeVariant?: 'red' | 'brand';
    highlight?: boolean;
  }>;
}

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const unreadCount = useUnreadNotificationCount();
  const { data: incidentsData } = useIncidents({ per_page: 50 });

  // Update clock every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const incidents = incidentsData?.items || [];
  const activeIncidents = incidents.filter(
    (i) => i.status !== 'resolved' && i.status !== 'rejected'
  );
  const criticalCount = activeIncidents.filter((i) => i.severity === 'critical').length;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    if (path === '/dashboard' && location.pathname === '/') return true;
    return location.pathname === path || (path !== '/dashboard' && location.pathname.startsWith(path + '/'));
  };

  const navSections: NavSection[] = [
    {
      title: 'Command Center',
      items: [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/map', label: 'Campus Map', icon: Map },
      ],
    },
    {
      title: 'Safety Intelligence',
      items: [
        {
          to: '/incidents',
          label: 'Incidents Feed',
          icon: AlertTriangle,
          badge: activeIncidents.length > 0 ? activeIncidents.length : undefined,
          badgeVariant: criticalCount > 0 ? 'red' : 'brand',
        },
        { to: '/incidents/new', label: 'Report Incident', icon: PlusCircle },
        {
          to: '/notifications',
          label: 'Notifications',
          icon: Bell,
          badge: unreadCount > 0 ? (unreadCount > 99 ? '99+' : unreadCount) : undefined,
          badgeVariant: 'red',
        },
      ],
    },
    {
      title: 'Navigation & Aid',
      items: [
        { to: '/routes', label: 'Safe Routes', icon: Route },
        { to: '/sos', label: 'SOS Emergency', icon: Siren, highlight: true },
      ],
    },
  ];

  const adminSection: NavSection = {
    title: 'Security Operations',
    items: [
      { to: '/admin', label: 'Operations Analytics', icon: Shield },
      { to: '/admin/incidents', label: 'Incident Triage', icon: AlertTriangle },
      { to: '/admin/users', label: 'User Directory', icon: Users },
    ],
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex text-slate-900 antialiased font-sans">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200/80 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-auto flex flex-col',
          sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <Link
            to="/dashboard"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-2.5 group"
          >
            <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <Shield className="w-5 h-5 text-white stroke-[2.2]" />
            </div>
            <div>
              <span className="text-base font-extrabold tracking-tight text-slate-950 block leading-tight">
                CampusSafe
              </span>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Safety Intelligence
              </span>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Safety Status Banner inside Sidebar */}
        <div className="mx-3 my-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'w-2 h-2 rounded-full animate-ping',
                criticalCount > 0 ? 'bg-red-500' : 'bg-emerald-500'
              )}
            />
            <span className="text-xs font-semibold text-slate-700">
              {criticalCount > 0 ? 'Critical Alert Active' : 'Campus Nominal'}
            </span>
          </div>
          <span className="text-[10px] font-bold text-slate-400 font-mono">
            {format(currentTime, 'HH:mm')}
          </span>
        </div>

        {/* Nav Items List */}
        <nav className="flex-1 px-3 space-y-4 overflow-y-auto py-2">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-1">
              <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {section.title}
              </p>
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.to);

                if (item.highlight) {
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        'flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150',
                        active
                          ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                          : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/80'
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 shrink-0 stroke-[2.2]" />
                        <span>{item.label}</span>
                      </div>
                      <span className="text-[10px] uppercase font-extrabold bg-rose-200/80 text-rose-900 px-1.5 py-0.2 rounded">
                        Emergency
                      </span>
                    </Link>
                  );
                }

                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      'flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150',
                      active
                        ? 'bg-brand-50 text-brand-700 font-bold border border-brand-200/80 shadow-xs'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={cn(
                          'w-4 h-4 shrink-0 transition-colors',
                          active ? 'text-brand-600' : 'text-slate-400'
                        )}
                      />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && (
                      <span
                        className={cn(
                          'text-[10px] font-bold px-1.5 py-0.2 rounded-full',
                          item.badgeVariant === 'red'
                            ? 'bg-rose-500 text-white'
                            : 'bg-brand-100 text-brand-700'
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}

          {/* Admin Navigation */}
          {user?.role === 'admin' && (
            <div className="space-y-1 pt-2 border-t border-slate-100">
              <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {adminSection.title}
              </p>
              {adminSection.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      'flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150',
                      active
                        ? 'bg-purple-50 text-purple-700 font-bold border border-purple-200/80 shadow-xs'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={cn(
                          'w-4 h-4 shrink-0',
                          active ? 'text-purple-600' : 'text-slate-400'
                        )}
                      />
                      <span>{item.label}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </nav>

        {/* User Profile Bar */}
        <div className="p-3 border-t border-slate-100">
          <Link
            to="/profile"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors group"
          >
            <Avatar name={user?.full_name} size="sm" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-900 truncate group-hover:text-brand-600">
                  {user?.full_name || 'Student'}
                </p>
                <span className="text-[9px] uppercase font-bold text-slate-400 bg-slate-100 px-1 py-0.2 rounded">
                  {user?.role || 'student'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
            </div>
          </Link>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top Navbar */}
        <header className="bg-white border-b border-slate-200/80 px-4 lg:px-8 py-3 flex items-center justify-between sticky top-0 z-30 shadow-subtle">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600"
              title="Open Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Quick Campus Status Indicator */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200/80 text-xs font-semibold text-slate-700">
              <span
                className={cn(
                  'w-2 h-2 rounded-full',
                  criticalCount > 0 ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'
                )}
              />
              <span>
                {criticalCount > 0
                  ? `${criticalCount} Active Hazard Alert`
                  : 'All Systems Normal'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Quick SOS Trigger in Header */}
            <Link to="/sos">
              <Button
                variant="danger"
                size="xs"
                className="font-extrabold shadow-sm text-[11px] px-3 py-1.5"
                leftIcon={<Siren className="w-3.5 h-3.5 mr-0.5" />}
              >
                SOS Dispatch
              </Button>
            </Link>

            {/* Notifications Bell */}
            <Link
              to="/notifications"
              className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-extrabold rounded-full w-4 h-4 flex items-center justify-center ring-2 ring-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>

            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 transition-colors focus:outline-none"
              >
                <Avatar name={user?.full_name} size="sm" />
              </button>

              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-floating border border-slate-200 p-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3 py-2 border-b border-slate-100 mb-1">
                      <p className="text-xs font-bold text-slate-900">{user?.full_name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                    </div>
                    <Link
                      to="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      Account Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors w-full mt-1"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
