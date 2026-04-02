'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { eventsApi, attendeesApi, analyticsApi } from '@/lib/api';
import { formatTimeAgo } from '@/lib/utils';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Camera, Keyboard, Download, Radio } from 'lucide-react';

interface CheckInResult {
  success: boolean;
  name?: string;
  ticket?: string;
  message?: string;
  error?: string;
}

export default function CheckInPage() {
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [scanResult, setScanResult] = useState<CheckInResult | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [mode, setMode] = useState<'camera' | 'manual'>('manual');
  const [recentCheckIns, setRecentCheckIns] = useState<any[]>([]);
  const [ciCount, setCiCount] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data: eventsData } = useQuery({
    queryKey: ['my-events-live'],
    queryFn: () => eventsApi.list({ status: 'LIVE' }).then(r => r.data),
  });

  const { data: liveStats, refetch: refetchStats } = useQuery({
    queryKey: ['checkin-live', selectedEventId],
    queryFn: () => selectedEventId
      ? analyticsApi.checkInLive(selectedEventId).then(r => r.data)
      : null,
    enabled: !!selectedEventId,
    refetchInterval: 10000,
  });

  useEffect(() => {
    if (liveStats) {
      setCiCount(liveStats.totalCheckedIn);
      setRecentCheckIns(liveStats.recentCheckIns || []);
    }
  }, [liveStats]);

  // Auto-focus manual input
  useEffect(() => {
    if (mode === 'manual') inputRef.current?.focus();
  }, [mode]);

  async function processCheckIn(qrCode: string) {
    if (!selectedEventId) {
      toast.error('Please select an event first');
      return;
    }
    if (!qrCode.trim()) return;

    try {
      const res = await attendeesApi.checkIn({ qrCode: qrCode.trim(), eventId: selectedEventId });
      const { attendee } = res.data;
      const result: CheckInResult = {
        success: true,
        name: attendee.name,
        ticket: attendee.ticket,
        message: 'Check-in successful',
      };
      setScanResult(result);
      setCiCount(prev => prev + 1);
      setRecentCheckIns(prev => [{
        attendee: { firstName: attendee.name.split(' ')[0], lastName: attendee.name.split(' ')[1] || '', ticketType: { name: attendee.ticket } },
        checkedInAt: new Date().toISOString(),
      }, ...prev.slice(0, 19)]);
      toast.success(`✅ ${attendee.name} checked in!`);
      await refetchStats();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Check-in failed';
      const result: CheckInResult = { success: false, error: errorMsg };
      setScanResult(result);
      toast.error(errorMsg);
    }

    setManualInput('');
    setTimeout(() => setScanResult(null), 4000);
  }

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    processCheckIn(manualInput);
  }

  const events = eventsData?.events || [];
  const total = liveStats?.totalRegistered || 0;
  const rate = total > 0 ? Math.round((ciCount / total) * 100) : 0;

  return (
    <div className="p-6 animate-fade-up">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
          </span>
          <span className="badge-live">Live Check-in</span>
        </div>
        <button
          onClick={() => toast('Exporting check-in report...')}
          className="btn-secondary text-xs flex items-center gap-1.5"
        >
          <Download size={12} /> Export
        </button>
      </div>

      {/* Event selector */}
      <div className="form-card mb-5">
        <label className="label">Select Event</label>
        <select
          className="input"
          value={selectedEventId}
          onChange={e => setSelectedEventId(e.target.value)}
        >
          <option value="">Choose an event...</option>
          {events.map((ev: any) => (
            <option key={ev.id} value={ev.id}>{ev.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Left: Scanner */}
        <div>
          {/* Mode toggle */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setMode('camera')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all border ${
                mode === 'camera'
                  ? 'bg-[var(--dark)] text-white border-[var(--dark)]'
                  : 'bg-white text-[var(--mid)] border-[var(--border)] hover:border-[var(--accent)]'
              }`}
            >
              <Camera size={14} /> Camera Scan
            </button>
            <button
              onClick={() => setMode('manual')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all border ${
                mode === 'manual'
                  ? 'bg-[var(--dark)] text-white border-[var(--dark)]'
                  : 'bg-white text-[var(--mid)] border-[var(--border)] hover:border-[var(--accent)]'
              }`}
            >
              <Keyboard size={14} /> Manual Entry
            </button>
          </div>

          {mode === 'camera' ? (
            <div className="bg-[var(--dark)] rounded-2xl w-full aspect-square flex flex-col items-center justify-center border-2 border-[var(--accent)] relative overflow-hidden">
              {/* Scan line animation */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[var(--accent2)] to-transparent animate-bounce" style={{ animationDuration: '2s' }} />
              {/* Corner markers */}
              {['top-3 left-3', 'top-3 right-3', 'bottom-3 left-3', 'bottom-3 right-3'].map((pos, i) => (
                <div key={i} className={`absolute ${pos} w-6 h-6 border-[var(--accent2)] border-[3px] ${
                  i === 0 ? 'border-r-0 border-b-0' :
                  i === 1 ? 'border-l-0 border-b-0' :
                  i === 2 ? 'border-r-0 border-t-0' :
                  'border-l-0 border-t-0'
                } rounded-sm`} />
              ))}
              <Camera size={48} className="text-white/20 mb-3" />
              <p className="text-white/40 text-sm">Point camera at QR badge</p>
              <p className="text-white/20 text-xs mt-1">Camera access required</p>
              <button
                onClick={() => processCheckIn('TEST-QR-' + Date.now())}
                className="mt-4 btn-primary text-xs"
              >
                ▶ Simulate Scan
              </button>
            </div>
          ) : (
            <form onSubmit={handleManualSubmit} className="space-y-3">
              <div>
                <label className="label">QR Code or Email</label>
                <input
                  ref={inputRef}
                  className="input text-sm font-mono"
                  value={manualInput}
                  onChange={e => setManualInput(e.target.value)}
                  placeholder="Scan QR or type attendee email..."
                  autoComplete="off"
                />
              </div>
              <button type="submit" className="btn-primary w-full">Check In Attendee</button>
            </form>
          )}

          {/* Scan result */}
          {scanResult && (
            <div className={`mt-4 p-4 rounded-xl border-2 text-center transition-all ${
              scanResult.success
                ? 'bg-green-50 border-green-400'
                : 'bg-red-50 border-red-400'
            }`}>
              {scanResult.success
                ? <CheckCircle size={36} className="text-green-500 mx-auto mb-2" />
                : <XCircle size={36} className="text-red-500 mx-auto mb-2" />
              }
              {scanResult.name && <div className="font-bold text-lg">{scanResult.name}</div>}
              {scanResult.ticket && <div className="text-sm text-[var(--muted)]">{scanResult.ticket}</div>}
              <div className={`text-sm font-semibold mt-1 ${scanResult.success ? 'text-green-600' : 'text-red-600'}`}>
                {scanResult.message || scanResult.error}
              </div>
              <button onClick={() => setScanResult(null)} className="mt-3 btn-primary text-xs w-full">
                Next Attendee →
              </button>
            </div>
          )}
        </div>

        {/* Right: Stats + Log */}
        <div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="stat-card">
              <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-xl bg-[var(--accent)]" />
              <div className="stat-label">Checked In</div>
              <div className="stat-number">{ciCount}</div>
              <div className="text-xs text-[var(--muted)] mt-1">of {total} registered</div>
            </div>
            <div className="stat-card">
              <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-xl bg-[var(--accent2)]" />
              <div className="stat-label">Rate</div>
              <div className="stat-number">{rate}%</div>
              <div className="flex items-center gap-1 mt-1">
                <Radio size={10} className="text-green-500" />
                <span className="text-[11px] text-green-600">Live updating</span>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="card p-4 mb-4">
            <div className="flex justify-between text-xs mb-2">
              <span className="text-[var(--muted)] font-medium">Check-in Progress</span>
              <span className="font-bold text-[var(--dark)]">{ciCount} / {total}</span>
            </div>
            <div className="h-2 bg-[var(--border)] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent2)] rounded-full transition-all duration-500"
                style={{ width: `${rate}%` }}
              />
            </div>
          </div>

          {/* Recent check-ins log */}
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--border)] text-sm font-bold text-[var(--dark)]">
              Recent Check-ins
            </div>
            <div className="max-h-[320px] overflow-y-auto no-scrollbar">
              {recentCheckIns.length === 0 ? (
                <div className="text-center py-8 text-sm text-[var(--muted)]">No check-ins yet</div>
              ) : (
                recentCheckIns.map((ci: any, i) => (
                  <div key={i} className={`flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] last:border-0 text-sm ${i === 0 ? 'bg-green-50' : ''}`}>
                    <CheckCircle size={16} className="text-green-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">
                        {ci.attendee?.firstName} {ci.attendee?.lastName}
                      </div>
                      <div className="text-xs text-[var(--muted)]">{ci.attendee?.ticketType?.name}</div>
                    </div>
                    <div className="text-[11px] text-[var(--muted)] whitespace-nowrap">
                      {formatTimeAgo(ci.checkedInAt)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
