'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { tasksApi } from '@/lib/api';
import { Plus, X, Flag, Clock, CheckSquare } from 'lucide-react';
import clsx from 'clsx';

const COLUMNS = [
  { key: 'todo',        label: 'To Do',       color: 'bg-gray-100' },
  { key: 'in_progress', label: 'In Progress',  color: 'bg-blue-50' },
  { key: 'review',      label: 'Review',       color: 'bg-yellow-50' },
  { key: 'done',        label: 'Done',         color: 'bg-green-50' },
] as const;

const PRIORITY_COLORS: Record<string, string> = {
  low:    'text-gray-400',
  medium: 'text-yellow-500',
  high:   'text-orange-500',
  urgent: 'text-red-600',
};

export default function TasksPage() {
  const [eventId] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const qc = useQueryClient();

  const { data: kanban, isLoading } = useQuery({
    queryKey: ['tasks', 'kanban', eventId],
    queryFn: () => tasksApi.kanban(eventId).then((r) => r.data),
  });

  const { register, handleSubmit, reset } = useForm<any>();

  const createMutation = useMutation({
    mutationFn: (data: any) => tasksApi.create({ ...data, eventId }),
    onSuccess: () => {
      toast.success('Task created!');
      qc.invalidateQueries({ queryKey: ['tasks'] });
      setShowCreate(false);
      reset();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      tasksApi.updateStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Task Board</h1>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> New Task
        </button>
      </div>

      {/* Kanban Board */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card animate-pulse h-64 bg-gray-100" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {COLUMNS.map(({ key, label, color }) => {
            const tasks: any[] = kanban?.[key] || [];
            return (
              <div key={key} className={`rounded-xl p-4 ${color} min-h-[300px]`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-700 text-sm">{label}</h3>
                  <span className="badge bg-white text-gray-600">{tasks.length}</span>
                </div>
                <div className="space-y-3">
                  {tasks.map((task: any) => (
                    <div key={task.id} className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-gray-900 leading-snug">{task.title}</p>
                        <Flag size={14} className={`flex-shrink-0 mt-0.5 ${PRIORITY_COLORS[task.priority]}`} />
                      </div>
                      {task.description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{task.description}</p>
                      )}
                      {task.dueDate && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                          <Clock size={11} />
                          {new Date(task.dueDate).toLocaleDateString()}
                        </div>
                      )}
                      {task.assignedTo && (
                        <p className="text-xs text-gray-400 mt-1">
                          → {task.assignedTo.firstName} {task.assignedTo.lastName}
                        </p>
                      )}
                      {/* Status move buttons */}
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {COLUMNS.filter((c) => c.key !== key).map((col) => (
                          <button
                            key={col.key}
                            onClick={() => statusMutation.mutate({ id: task.id, status: col.key })}
                            className="text-xs text-brand-600 hover:underline"
                          >
                            → {col.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  {tasks.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-8">No tasks</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <CheckSquare size={20} /> New Task
              </h2>
              <button onClick={() => { setShowCreate(false); reset(); }} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit((data) => createMutation.mutate(data))} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input {...register('title', { required: true })} className="input" placeholder="Task title..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea {...register('description')} className="input min-h-[80px] resize-y" placeholder="Optional details..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select {...register('priority')} className="input">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input {...register('dueDate')} type="date" className="input" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={createMutation.isPending} className="btn-primary flex-1">
                  {createMutation.isPending ? 'Creating...' : 'Create Task'}
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
