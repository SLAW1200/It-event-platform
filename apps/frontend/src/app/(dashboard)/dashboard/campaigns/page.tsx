'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { campaignsApi } from '@/lib/api';
import { Mail, Plus, Send, BarChart2, X } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  draft:     'bg-gray-100 text-gray-600',
  scheduled: 'bg-blue-100 text-blue-700',
  sending:   'bg-yellow-100 text-yellow-700',
  sent:      'bg-green-100 text-green-700',
  failed:    'bg-red-100 text-red-700',
};

export default function CampaignsPage() {
  const [eventId] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const qc = useQueryClient();

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ['campaigns', eventId],
    queryFn: () => campaignsApi.list(eventId).then((r) => r.data),
  });

  const { data: analytics } = useQuery({
    queryKey: ['campaigns', 'analytics', selected?.id],
    queryFn: () => campaignsApi.analytics(selected.id).then((r) => r.data),
    enabled: !!selected,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<any>();

  const createMutation = useMutation({
    mutationFn: (data: any) => campaignsApi.create({ ...data, eventId }),
    onSuccess: () => {
      toast.success('Campaign created!');
      qc.invalidateQueries({ queryKey: ['campaigns'] });
      setShowCreate(false);
      reset();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Email Campaigns</h1>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> New Campaign
        </button>
      </div>

      {/* Campaign List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card animate-pulse h-32 bg-gray-100" />
          ))
        ) : campaigns?.length === 0 ? (
          <div className="col-span-2 text-center py-16 text-gray-400">
            <Mail size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">No campaigns yet</p>
            <p className="text-sm">Create your first email campaign</p>
          </div>
        ) : (
          campaigns?.map((c: any) => (
            <div
              key={c.id}
              className={`card cursor-pointer hover:shadow-md transition-shadow ${selected?.id === c.id ? 'ring-2 ring-brand-500' : ''}`}
              onClick={() => setSelected(selected?.id === c.id ? null : c)}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{c.name}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">{c.subject}</p>
                </div>
                <span className={`badge ml-2 flex-shrink-0 ${STATUS_COLORS[c.status]}`}>{c.status}</span>
              </div>
              <div className="grid grid-cols-3 gap-3 mt-4 text-center text-xs text-gray-500">
                <div>
                  <p className="font-bold text-gray-900 text-base">{c.totalSent || 0}</p>
                  <p>Sent</p>
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-base">{c.totalOpened || 0}</p>
                  <p>Opened</p>
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-base">{c.totalClicked || 0}</p>
                  <p>Clicked</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Analytics Panel */}
      {selected && analytics && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <BarChart2 size={18} /> {analytics.name} — Analytics
            </h2>
            <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Sent',        value: analytics.totalSent },
              { label: 'Open Rate',   value: `${analytics.openRate}%` },
              { label: 'Click Rate',  value: `${analytics.clickRate}%` },
              { label: 'Bounced',     value: analytics.totalBounced || 0 },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-500 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">New Campaign</h2>
              <button onClick={() => { setShowCreate(false); reset(); }} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit((data) => createMutation.mutate(data))} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name</label>
                <input {...register('name', { required: true })} className="input" placeholder="Welcome email" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject Line</label>
                <input {...register('subject', { required: true })} className="input" placeholder="You're registered for {{event_name}}!" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content (HTML or text)</label>
                <textarea
                  {...register('content', { required: true })}
                  className="input min-h-[120px] resize-y"
                  placeholder="Hi {{name}}, welcome to the event!"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={createMutation.isPending} className="btn-primary flex-1">
                  {createMutation.isPending ? 'Creating...' : 'Create Campaign'}
                </button>
                <button type="button" onClick={() => { setShowCreate(false); reset(); }} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
