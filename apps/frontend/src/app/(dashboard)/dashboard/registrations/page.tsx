'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { registrationsApi } from '@/lib/api';
import { Search, Users, CheckCircle, XCircle, Clock, Download } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  pending:    'bg-yellow-100 text-yellow-700',
  confirmed:  'bg-green-100 text-green-700',
  cancelled:  'bg-red-100 text-red-700',
  waitlisted: 'bg-blue-100 text-blue-700',
  checked_in: 'bg-purple-100 text-purple-700',
};

export default function RegistrationsPage() {
  const [eventId, setEventId] = useState(1);
  const [search, setSearch] = useState('');
  const qc = useQueryClient();

  const { data: regs, isLoading } = useQuery({
    queryKey: ['registrations', 'event', eventId],
    queryFn: () => registrationsApi.byEvent(eventId).then((r) => r.data),
  });

  const { data: stats } = useQuery({
    queryKey: ['registrations', 'stats', eventId],
    queryFn: () => registrationsApi.stats(eventId).then((r) => r.data),
  });

  const confirmMutation = useMutation({
    mutationFn: (id: number) => registrationsApi.confirm(id),
    onSuccess: () => {
      toast.success('Registration confirmed');
      qc.invalidateQueries({ queryKey: ['registrations'] });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => registrationsApi.cancel(id),
    onSuccess: () => {
      toast.success('Registration cancelled');
      qc.invalidateQueries({ queryKey: ['registrations'] });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const filtered = regs?.filter((r: any) => {
    if (!search) return true;
    const name = `${r.user?.firstName} ${r.user?.lastName} ${r.user?.email}`.toLowerCase();
    return name.includes(search.toLowerCase());
  }) ?? [];

  const exportCsv = () => {
    if (!regs?.length) return;
    const rows = [
      ['ID', 'First Name', 'Last Name', 'Email', 'Company', 'Status', 'Amount Paid', 'Date'],
      ...regs.map((r: any) => [
        r.id,
        r.user?.firstName,
        r.user?.lastName,
        r.user?.email,
        r.user?.company || '',
        r.status,
        r.amountPaid || 0,
        new Date(r.registrationDate).toLocaleDateString(),
      ]),
    ];
    const csv = rows.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `registrations-event-${eventId}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Registrations</h1>
        <button onClick={exportCsv} className="btn-secondary flex items-center gap-2 text-sm">
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Object.entries(stats.byStatus || {}).map(([status, count]) => (
            <div key={status} className="card text-center py-4">
              <p className="text-2xl font-bold text-gray-900">{count as number}</p>
              <p className="text-xs text-gray-500 capitalize mt-1">{status.replace('_', ' ')}</p>
            </div>
          ))}
          <div className="card text-center py-4">
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-xs text-gray-500 mt-1">Total</p>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-10"
          placeholder="Search by name or email..."
        />
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-left text-gray-500">
                <th className="px-6 py-3 font-medium">Participant</th>
                <th className="px-6 py-3 font-medium">Company</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Amount</th>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    <Users size={36} className="mx-auto mb-2 opacity-30" />
                    No registrations found
                  </td>
                </tr>
              ) : (
                filtered.map((reg: any) => (
                  <tr key={reg.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">
                        {reg.user?.firstName} {reg.user?.lastName}
                      </p>
                      <p className="text-gray-500 text-xs">{reg.user?.email}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{reg.user?.company || '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`badge ${STATUS_COLORS[reg.status] || 'bg-gray-100 text-gray-600'}`}>
                        {reg.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {reg.amountPaid > 0 ? `$${reg.amountPaid}` : 'Free'}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(reg.registrationDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {reg.status === 'pending' && (
                          <button
                            onClick={() => confirmMutation.mutate(reg.id)}
                            className="text-green-600 hover:text-green-800"
                            title="Confirm"
                          >
                            <CheckCircle size={18} />
                          </button>
                        )}
                        {reg.status !== 'cancelled' && reg.status !== 'checked_in' && (
                          <button
                            onClick={() => cancelMutation.mutate(reg.id)}
                            className="text-red-500 hover:text-red-700"
                            title="Cancel"
                          >
                            <XCircle size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
