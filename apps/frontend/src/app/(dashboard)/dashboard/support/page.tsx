'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { supportApi } from '@/lib/api';
import { HeadphonesIcon, Plus, X, AlertTriangle, CheckCircle, Clock, MessageCircle } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  open:        'bg-red-100 text-red-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  resolved:    'bg-green-100 text-green-700',
  closed:      'bg-gray-100 text-gray-600',
};

const PRIORITY_COLORS: Record<string, string> = {
  low:      'text-gray-400',
  medium:   'text-yellow-500',
  high:     'text-orange-500',
  critical: 'text-red-600',
};

export default function SupportPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [replyText, setReplyText] = useState('');
  const qc = useQueryClient();

  const { data: tickets, isLoading } = useQuery({
    queryKey: ['tickets'],
    queryFn: () => supportApi.list().then((r) => r.data),
  });

  const { data: stats } = useQuery({
    queryKey: ['tickets', 'stats'],
    queryFn: () => supportApi.stats().then((r) => r.data),
  });

  const { data: detail } = useQuery({
    queryKey: ['tickets', selected?.id],
    queryFn: () => supportApi.get(selected.id).then((r) => r.data),
    enabled: !!selected,
  });

  const { register, handleSubmit, reset } = useForm<any>();

  const createMutation = useMutation({
    mutationFn: (data: any) => supportApi.create({ ...data, userId: 1 }),
    onSuccess: () => {
      toast.success('Ticket created');
      qc.invalidateQueries({ queryKey: ['tickets'] });
      setShowCreate(false);
      reset();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const replyMutation = useMutation({
    mutationFn: ({ id, content }: { id: number; content: string }) =>
      supportApi.reply(id, { senderId: 1, content }),
    onSuccess: () => {
      setReplyText('');
      qc.invalidateQueries({ queryKey: ['tickets', selected?.id] });
    },
  });

  const resolveMutation = useMutation({
    mutationFn: (id: number) => supportApi.resolve(id),
    onSuccess: () => {
      toast.success('Ticket resolved');
      qc.invalidateQueries({ queryKey: ['tickets'] });
    },
  });

  const escalateMutation = useMutation({
    mutationFn: (id: number) => supportApi.escalate(id),
    onSuccess: () => {
      toast.success('Ticket escalated to critical');
      qc.invalidateQueries({ queryKey: ['tickets'] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> New Ticket
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Open',        value: stats.open,       color: 'text-red-600' },
            { label: 'In Progress', value: stats.inProgress, color: 'text-yellow-600' },
            { label: 'Resolved',    value: stats.resolved,   color: 'text-green-600' },
            { label: 'Total',       value: stats.total,      color: 'text-gray-900' },
          ].map(({ label, value, color }) => (
            <div key={label} className="card text-center py-4">
              <p className={`text-2xl font-bold ${color}`}>{value ?? 0}</p>
              <p className="text-xs text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ticket List */}
        <div className="space-y-3">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="card animate-pulse h-20 bg-gray-100" />
            ))
          ) : tickets?.length === 0 ? (
            <div className="text-center py-16 text-gray-400 card">
              <HeadphonesIcon size={36} className="mx-auto mb-3 opacity-30" />
              <p>No support tickets</p>
            </div>
          ) : (
            tickets?.map((t: any) => (
              <div
                key={t.id}
                className={`card cursor-pointer hover:shadow-md transition-shadow ${selected?.id === t.id ? 'ring-2 ring-brand-500' : ''}`}
                onClick={() => setSelected(t)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{t.subject}</p>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{t.description}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <span className={`badge ${STATUS_COLORS[t.status]}`}>{t.status.replace('_', ' ')}</span>
                    <AlertTriangle size={14} className={PRIORITY_COLORS[t.priority]} />
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(t.createdAt).toLocaleDateString()}
                  {t.messages?.length > 0 && ` · ${t.messages.length} message${t.messages.length !== 1 ? 's' : ''}`}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Ticket Detail */}
        {selected && (
          <div className="card">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="font-semibold text-gray-900">{detail?.subject || selected.subject}</h2>
                <div className="flex gap-2 mt-1">
                  <span className={`badge ${STATUS_COLORS[detail?.status || selected.status]}`}>
                    {(detail?.status || selected.status).replace('_', ' ')}
                  </span>
                  <span className={`badge bg-gray-100 text-gray-600`}>
                    {detail?.priority || selected.priority}
                  </span>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">{detail?.description || selected.description}</p>

            {/* Messages */}
            <div className="space-y-3 max-h-48 overflow-y-auto mb-4">
              {detail?.messages?.map((m: any, i: number) => (
                <div key={i} className={`p-3 rounded-lg text-sm ${m.isInternal ? 'bg-yellow-50 border border-yellow-100' : 'bg-gray-50'}`}>
                  <p className="text-gray-800">{m.content}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(m.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>

            {/* Reply */}
            {detail?.status !== 'closed' && detail?.status !== 'resolved' && (
              <div className="flex gap-2">
                <input
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="input flex-1 text-sm"
                  placeholder="Write a reply..."
                />
                <button
                  onClick={() => replyMutation.mutate({ id: selected.id, content: replyText })}
                  disabled={!replyText.trim()}
                  className="btn-primary text-sm"
                >
                  <MessageCircle size={16} />
                </button>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 mt-4">
              {detail?.status !== 'resolved' && detail?.status !== 'closed' && (
                <button onClick={() => resolveMutation.mutate(selected.id)} className="btn-secondary text-sm flex items-center gap-1.5">
                  <CheckCircle size={15} /> Resolve
                </button>
              )}
              {detail?.priority !== 'critical' && (
                <button onClick={() => escalateMutation.mutate(selected.id)} className="btn-secondary text-sm text-red-600 flex items-center gap-1.5">
                  <AlertTriangle size={15} /> Escalate
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">New Support Ticket</h2>
              <button onClick={() => { setShowCreate(false); reset(); }} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit((data) => createMutation.mutate(data))} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input {...register('subject', { required: true })} className="input" placeholder="Brief description of your issue" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea {...register('description', { required: true })} className="input min-h-[100px] resize-y" placeholder="Detailed description..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select {...register('priority')} className="input">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={createMutation.isPending} className="btn-primary flex-1">
                  {createMutation.isPending ? 'Submitting...' : 'Submit Ticket'}
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
