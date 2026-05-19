'use client';
import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import { checkInApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { QrCode, UserCheck, Users, TrendingUp, Wifi } from 'lucide-react';

let socket: Socket | null = null;

export default function CheckInPage() {
  const [eventId, setEventId] = useState<number>(1);
  const [qrInput, setQrInput] = useState('');
  const [liveCheckIns, setLiveCheckIns] = useState<any[]>([]);
  const [connected, setConnected] = useState(false);

  // Fetch attendance stats
  const { data: attendance, refetch } = useQuery({
    queryKey: ['attendance', eventId],
    queryFn: () => checkInApi.attendance(eventId).then((r) => r.data),
    refetchInterval: 10_000,
  });

  // WebSocket connection
  useEffect(() => {
    socket = io(`${process.env.NEXT_PUBLIC_WS_URL}/checkin`);
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.emit('join-event', eventId);
    socket.on('check-in', (data: any) => {
      setLiveCheckIns((prev) => [data, ...prev].slice(0, 20));
      refetch();
    });
    return () => { socket?.disconnect(); };
  }, [eventId]);

  // QR check-in mutation
  const qrMutation = useMutation({
    mutationFn: (payload: string) => checkInApi.qr(payload, 1),
    onSuccess: () => {
      toast.success('✅ Checked in successfully!');
      setQrInput('');
      refetch();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Check-in failed'),
  });

  const handleQrSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (qrInput.trim()) qrMutation.mutate(qrInput.trim());
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Live Check-in</h1>
        <div className={`flex items-center gap-2 text-sm ${connected ? 'text-green-600' : 'text-gray-400'}`}>
          <Wifi size={16} />
          {connected ? 'Live' : 'Connecting...'}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Registered', value: attendance?.totalRegistrations, icon: Users, color: 'text-blue-600' },
          { label: 'Checked In',       value: attendance?.checkedIn,          icon: UserCheck, color: 'text-green-600' },
          { label: 'Not Checked In',   value: attendance?.notCheckedIn,       icon: Users, color: 'text-orange-500' },
          { label: 'Attendance Rate',  value: attendance ? `${attendance.attendanceRate}%` : undefined, icon: TrendingUp, color: 'text-purple-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card text-center">
            <Icon size={28} className={`mx-auto mb-2 ${color}`} />
            <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
            <p className="text-xs text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* QR Scanner */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <QrCode size={20} /> Scan QR Code
          </h2>
          <form onSubmit={handleQrSubmit} className="space-y-3">
            <input
              value={qrInput}
              onChange={(e) => setQrInput(e.target.value)}
              className="input font-mono text-sm"
              placeholder="Scan or paste QR code payload..."
              autoFocus
            />
            <button type="submit" disabled={qrMutation.isPending} className="btn-primary w-full">
              {qrMutation.isPending ? 'Processing...' : 'Check In'}
            </button>
          </form>
          <p className="text-xs text-gray-400 mt-3">
            Use a QR scanner connected to this input, or paste the QR payload directly.
          </p>
        </div>

        {/* Live Feed */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <UserCheck size={20} /> Live Check-in Feed
          </h2>
          {liveCheckIns.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">Waiting for check-ins...</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {liveCheckIns.map((ci, i) => (
                <div key={i} className="flex items-center gap-3 p-2 bg-green-50 rounded-lg border border-green-100">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <UserCheck size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{ci.userName || `Registration #${ci.registrationId}`}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(ci.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Check-ins table */}
      {attendance?.recentCheckIns?.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Recent Check-ins</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="pb-2">Name</th>
                  <th className="pb-2">Time</th>
                  <th className="pb-2">Method</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {attendance.recentCheckIns.map((ci: any) => (
                  <tr key={ci.id}>
                    <td className="py-2 font-medium">
                      {ci.registration?.user?.firstName} {ci.registration?.user?.lastName}
                    </td>
                    <td className="py-2 text-gray-500">
                      {new Date(ci.checkInTime).toLocaleTimeString()}
                    </td>
                    <td className="py-2">
                      <span className="badge bg-gray-100 text-gray-600">{ci.checkInMethod}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
