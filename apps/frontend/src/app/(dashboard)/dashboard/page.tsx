'use client';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi, eventsApi } from '@/lib/api';
import { Calendar, Users, DollarSign, TrendingUp } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

function StatCard({ label, value, icon: Icon, color }: any) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={24} className="text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  const { data: platform } = useQuery({
    queryKey: ['analytics', 'platform'],
    queryFn: () => analyticsApi.platform().then((r) => r.data),
  });

  const { data: events } = useQuery({
    queryKey: ['events', 'recent'],
    queryFn: () => eventsApi.list({ limit: 5, sortBy: 'createdAt' }).then((r) => r.data),
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.firstName} 👋
        </h1>
        <p className="text-gray-500 mt-1">Here's what's happening across your events</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Total Events"        value={platform?.totalEvents}        icon={Calendar}   color="bg-brand-600" />
        <StatCard label="Total Participants"  value={platform?.totalUsers}         icon={Users}      color="bg-green-500" />
        <StatCard label="Total Registrations" value={platform?.totalRegistrations} icon={TrendingUp} color="bg-blue-500" />
        <StatCard
          label="Total Revenue"
          value={platform?.totalRevenue != null ? `$${Number(platform.totalRevenue).toLocaleString()}` : undefined}
          icon={DollarSign}
          color="bg-amber-500"
        />
      </div>

      {/* Recent Events */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Events</h2>
        {events?.data?.length === 0 && (
          <p className="text-gray-400 text-sm">No events yet. Create your first event!</p>
        )}
        <div className="divide-y divide-gray-100">
          {events?.data?.map((event: any) => (
            <div key={event.id} className="py-3 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{event.name}</p>
                <p className="text-sm text-gray-500">
                  {new Date(event.startDate).toLocaleDateString()} · {event.city || 'TBD'}
                </p>
              </div>
              <span className={`badge ${
                event.status === 'published' ? 'bg-green-100 text-green-700' :
                event.status === 'draft'     ? 'bg-gray-100 text-gray-600'  :
                event.status === 'cancelled' ? 'bg-red-100 text-red-700'    :
                'bg-blue-100 text-blue-700'
              }`}>
                {event.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
