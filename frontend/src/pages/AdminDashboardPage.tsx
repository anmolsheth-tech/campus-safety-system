import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Shield,
  Users,
  TrendingUp,
  Activity,
  BarChart3,
  PieChart as PieIcon,
  ShieldCheck,
} from 'lucide-react';
import { Card, KPICard, LoadingSpinner, PageHeader, KPICardSkeleton } from '@/components/ui';
import { adminService } from '@/services/adminService';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { CampusMap } from '@/components/map';

const COLORS = ['#3B66F5', '#EF4444', '#F59E0B', '#10B981', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316', '#64748B'];

export default function AdminDashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminService.getDashboardStats(),
  });

  const { data: trends, isLoading: trendsLoading } = useQuery({
    queryKey: ['admin-trends'],
    queryFn: () => adminService.getIncidentTrends('30d'),
  });

  if (statsLoading || trendsLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="h-8 w-64 bg-slate-200 animate-pulse rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <KPICardSkeleton />
          <KPICardSkeleton />
          <KPICardSkeleton />
          <KPICardSkeleton />
          <KPICardSkeleton />
          <KPICardSkeleton />
        </div>
      </div>
    );
  }

  const typeData = stats
    ? Object.entries(stats.incidents_by_type).map(([name, value]) => ({
        name: name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
        value,
      }))
    : [];

  const severityData = stats
    ? Object.entries(stats.incidents_by_severity).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
      }))
    : [];

  const trendData =
    trends?.map((t) => ({
      date: t.date,
      incidents: t.count,
    })) || [];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Security Operations Analytics"
        subtitle="Campus-wide incident triage metrics, resolution velocity, and hotspot tracking."
        badge="Command Center"
        badgeVariant="info"
      />

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard
          icon={<AlertTriangle className="w-5 h-5" />}
          label="Active Hazards"
          value={stats?.active_incidents || 0}
          color="red"
        />
        <KPICard
          icon={<ShieldCheck className="w-5 h-5" />}
          label="Verified Cases"
          value={stats?.verified_incidents || 0}
          color="purple"
        />
        <KPICard
          icon={<CheckCircle className="w-5 h-5" />}
          label="Resolved"
          value={stats?.resolved_incidents || 0}
          color="green"
        />
        <KPICard
          icon={<Activity className="w-5 h-5" />}
          label="Risk Hotspots"
          value={stats?.high_risk_zones || 0}
          color="amber"
        />
        <KPICard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Reports Today"
          value={stats?.reports_today || 0}
          color="blue"
        />
        <KPICard
          icon={<Clock className="w-5 h-5" />}
          label="Avg Dispatch"
          value={`${stats?.avg_response_time_minutes || 0}m`}
          color="purple"
        />
      </div>

      {/* Chart Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Incidents by Type */}
        <Card>
          <div className="pb-3 border-b border-slate-100 mb-4">
            <h3 className="text-sm font-bold text-slate-900">
              Incident Distribution by Type
            </h3>
            <p className="text-xs text-slate-500">Historical campus breakdown</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={typeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" height={60} stroke="#94A3B8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94A3B8" />
                <Tooltip />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {typeData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Chart 2: Severity Distribution */}
        <Card>
          <div className="pb-3 border-b border-slate-100 mb-4">
            <h3 className="text-sm font-bold text-slate-900">
              Severity Level Distribution
            </h3>
            <p className="text-xs text-slate-500">Proportion of threat classifications</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={severityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {severityData.map((_, index) => (
                    <Cell
                      key={index}
                      fill={['#EAB308', '#F97316', '#EF4444', '#DC2626'][index] || COLORS[index]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Chart 3: Trends Over Time */}
        <Card className="lg:col-span-2">
          <div className="pb-3 border-b border-slate-100 mb-4">
            <h3 className="text-sm font-bold text-slate-900">
              Incident Frequency Over 30 Days
            </h3>
            <p className="text-xs text-slate-500">Daily reporting volume telemetry</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94A3B8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94A3B8" />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="incidents"
                  stroke="#3B66F5"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#3B66F5' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Embedded Map Section */}
      <Card>
        <div className="pb-3 border-b border-slate-100 mb-4">
          <h3 className="text-sm font-bold text-slate-900">
            Campus Incident & Danger Perimeter Map
          </h3>
          <p className="text-xs text-slate-500">Spatial visualization of open cases</p>
        </div>
        <div className="h-[400px] rounded-2xl overflow-hidden border border-slate-200">
          <CampusMap showRoutePanel={false} showDestinationSelector={false} />
        </div>
      </Card>
    </div>
  );
}
