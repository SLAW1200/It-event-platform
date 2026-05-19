'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { eventsApi } from '@/lib/api';
import { Plus, Search, Calendar, MapPin, Users } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  draft:     'bg-gray-100 text-gray-600',
  published: 'bg-green-100 text-green-700',
  ongoing:   'bg-blue-100 text-blue-700',
  completed: 'bg-purple-100 text-purple-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function EventsPage() {
  const [search, setSearch] = useState('');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['events', search],
    queryFn: () => eventsApi.list({ search, limit: 50 }).then((r) => r.data),
  });

  const publishMutation = useMutation({
    mutationFn: (id: number) => eventsApi.publish(id),
    onSuccess: () => {
      toast.success('Event published!');
      qc.invalidateQueries({ queryKey: ['events'] });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to publish'),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Events</h1>
        <Link href="/dashboard/events/new" className="btn-primary flex items-center gap-2">
          <Plus size={18} /> New Event
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-10"
          placeholder="Search events..."
        />
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card animate-pulse h-48 bg-gray-100" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data?.data?.map((event: any) => (
            <div key={event.id} className="card hover:shadow-md transition-shadow">
              {event.coverImage && (
                <img src={event.coverImage} alt={event.name}
                  className="w-full h-36 object-cover rounded-lg mb-4 -mt-2" />
              )}
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-gray-900 leading-tight">{event.name}</h3>
                <span className={`badge ml-2 flex-shrink-0 ${STATUS_COLORS[event.status]}`}>
                  {event.status}
                </span>
              </div>
              <div className="space-y-1.5 text-sm text-gray-500 mb-4">
                <div className="flex items-center gap-2">
                  <Calendar size={14} />
                  {new Date(event.startDate).toLocaleDateString()}
                </div>
                {event.city && (
                  <div className="flex items-center gap-2">
                    <MapPin size={14} /> {event.city}, {event.country}
                  </div>
                )}
                {event.maxParticipants && (
                  <div className="flex items-center gap-2">
                    <Users size={14} /> Max {event.maxParticipants} participants
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Link href={`/dashboard/events/${event.id}`} className="btn-secondary text-xs flex-1 text-center">
                  View
                </Link>
                {event.status === 'draft' && (
                  <button
                    onClick={() => publishMutation.mutate(event.id)}
                    className="btn-primary text-xs flex-1"
                  >
                    Publish
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {data?.data?.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <Calendar size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No events found</p>
          <p className="text-sm">Create your first event to get started</p>
        </div>
      )}
    </div>
  );
}
