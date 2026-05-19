'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { analyticsApi } from '@/lib/api';
import { format } from 'date-fns';

export default function AnalyticsPage() {
  const [eventId, setEventId] = useState(1);

  const { data: dashboard } = useQuery({
    queryKey: ['analytics', 'dashboard', eventId],
    queryFn: () => analyticsApi.dashboard(eventId).then((r) => r.data),
  });

  const { data: regTimeline } = useQuery({
    queryKey: ['analytics', 'reg-timeline', eventId],
    queryFn: () =>
      analyticsApi.registrationTimeline(eventId).then((r) =>
        r.data.map((d: any) => ({
          date: format(new Date(d.date), 'MMM d'),
          count: parseInt(d.count),
        })),
      ),
  });

  const { data: checkinTimeline } = useQuery({
    queryKey: ['analytics', 'checkin-timeline', eventId],
    queryFn: () =>
      analyticsApi.checkInTimeline(eventId).then((r) =>
        r.data.map((d: any) => ({
          hour: format(new Date(d.hour), 'HH:mm'),
          count: parseInt(d.count),
        })),
      ),
  });

  const stats = dashboard?.registrations;
  const revenue = dashboard?.revenue;
  const email = dashboard?.email;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Registrations', value: stats?.total },
          { label: 'Confirmed',           value: stats?.confirmed },
          { label: 'Checked In',          value: stats?.checkedIn },
          { label: 'Attendance Rate',     value: stats ? `${stats.attendanceRate}%` : undefined },
        ].map(({ label, value }) => (
          <div key={label} className="card">
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value ?? '—'}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[
          { label: 'Total Revenue',    value: revenue ? `$${Number(revenue.total).toLocaleString()}` : undefined },
          { label: 'Avg / Registration', value: revenue ? `$${revenue.avgPerRegistration}` : undefined },
          { label: 'Emails Sent',      value: email?.sent },
        ].map(({ label, value }) => (
          <div key={label} className="card">
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value ?? '—'}</p>
          </div>
        ))}
      </div>

      {/* Registration Timeline */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">Registrations Over Time</h2>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={regTimeline || []}>
            <defs>
              <linearGradient id="colorReg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Area
              type="monotone" dataKey="count" stroke="#6366f1"
              strokeWidth={2} fill="url(#colorReg)" name="Registrations"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Check-in Timeline */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">Check-ins by Hour</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={checkinTimeline || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="hour" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} name="Check-ins" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Email stats */}
      {email && (
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Email Performance</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Sent',    value: email.sent },
              { label: 'Opened', value: `${email.opened} (${email.openRate}%)` },
              { label: 'Clicked', value: `${email.clicked} (${email.clickRate}%)` },
              { label: 'Bounced', value: email.bounced || 0 },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500">{label}</p>
                <p className="font-bold text-gray-900 mt-1">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
