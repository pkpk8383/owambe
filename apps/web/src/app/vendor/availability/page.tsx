'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vendorsApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, isToday, isBefore, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';

type DayState = 'available' | 'blocked' | 'booked' | 'neutral';

export default function VendorAvailabilityPage() {
  const { user } = useAuthStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<'block' | 'open'>('block');
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();

  const vendorId = user?.profile?.id;

  const { data: availData } = useQuery({
    queryKey: ['availability', vendorId, format(currentMonth, 'yyyy-MM')],
    queryFn: () => vendorsApi.getAvailability(vendorId!, {
      month: currentMonth.getMonth() + 1,
      year: currentMonth.getFullYear(),
    }).then(r => r.data),
    enabled: !!vendorId,
  });

  const setAvailMutation = useMutation({
    mutationFn: (dates: any[]) => vendorsApi.setAvailability(dates),
    onSuccess: () => {
      toast.success('Availability updated!');
      setSelectedDates(new Set());
      queryClient.invalidateQueries({ queryKey: ['availability'] });
    },
  });

  const availability = availData?.availability || [];
  const bookings = availData?.bookings || [];

  // Build day state map
  const stateMap: Record<string, DayState> = {};
  availability.forEach((a: any) => {
    const d = format(new Date(a.date), 'yyyy-MM-dd');
    stateMap[d] = a.isBlocked ? 'blocked' : a.isAvailable ? 'available' : 'neutral';
  });
  bookings.forEach((b: any) => {
    const d = format(new Date(b.eventDate), 'yyyy-MM-dd');
    stateMap[d] = 'booked';
  });

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const startPadding = getDay(startOfMonth(currentMonth));

  function toggleDate(dateStr: string) {
    const d = new Date(dateStr);
    if (isBefore(d, startOfDay(new Date()))) return;
    if (stateMap[dateStr] === 'booked') return;
    setSelectedDates(prev => {
      const next = new Set(prev);
      if (next.has(dateStr)) next.delete(dateStr);
      else next.add(dateStr);
      return next;
    });
  }

  async function applyToSelected() {
    if (selectedDates.size === 0) return;
    setIsSaving(true);
    try {
      const dates = Array.from(selectedDates).map(d => ({
        date: d,
        isAvailable: mode === 'open',
        isBlocked: mode === 'block',
      }));
      await setAvailMutation.mutateAsync(dates);
    } finally {
      setIsSaving(false);
    }
  }

  function getDayStyle(dateStr: string): string {
    const state = stateMap[dateStr];
    const isSelected = selectedDates.has(dateStr);
    const past = isBefore(new Date(dateStr), startOfDay(new Date()));

    if (isSelected) return 'bg-[var(--accent2)] text-white font-bold';
    if (state === 'booked') return 'bg-[var(--accent)] text-white cursor-not-allowed';
    if (state === 'blocked') return 'bg-red-100 text-red-600 line-through';
    if (state === 'available') return 'bg-green-100 text-green-700';
    if (past) return 'text-[var(--border)] cursor-not-allowed';
    return 'hover:bg-[var(--bg)] text-[var(--dark)]';
  }

  return (
    <div className="p-6 animate-fade-up">
      <div className="grid grid-cols-[1fr_280px] gap-5">
        {/* Calendar */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-base">{format(currentMonth, 'MMMM yyyy')}</h2>
            <div className="flex gap-1">
              <button onClick={() => setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() - 1))}
                className="p-1.5 rounded-lg hover:bg-[var(--bg)] transition-colors">
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() + 1))}
                className="p-1.5 rounded-lg hover:bg-[var(--bg)] transition-colors">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
              <div key={d} className="text-center text-xs font-semibold text-[var(--muted)] py-2">{d}</div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: startPadding }).map((_, i) => (
              <div key={`pad-${i}`} />
            ))}
            {days.map(day => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const today = isToday(day);
              return (
                <button
                  key={dateStr}
                  onClick={() => toggleDate(dateStr)}
                  className={cn(
                    'aspect-square rounded-lg text-sm flex items-center justify-center transition-all',
                    getDayStyle(dateStr),
                    today && 'ring-2 ring-[var(--accent2)]'
                  )}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex gap-4 mt-4 pt-4 border-t border-[var(--border)]">
            {[
              { color: 'bg-green-100', label: 'Available' },
              { color: 'bg-red-100', label: 'Blocked' },
              { color: 'bg-[var(--accent)]', label: 'Booked' },
              { color: 'bg-[var(--accent2)]', label: 'Selected' },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
                <div className={`w-3 h-3 rounded ${l.color}`} />
                {l.label}
              </div>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-4">
          <div className="card p-4">
            <div className="text-sm font-bold mb-3">Apply to Selected Days</div>
            <div className="text-xs text-[var(--muted)] mb-3">
              {selectedDates.size === 0
                ? 'Click days on the calendar to select'
                : `${selectedDates.size} day${selectedDates.size > 1 ? 's' : ''} selected`}
            </div>

            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setMode('open')}
                className={cn('flex-1 py-2 rounded-lg text-xs font-semibold border transition-all',
                  mode === 'open'
                    ? 'bg-green-500 text-white border-green-500'
                    : 'border-[var(--border)] text-[var(--mid)] hover:border-green-500')}>
                ✓ Mark Open
              </button>
              <button
                onClick={() => setMode('block')}
                className={cn('flex-1 py-2 rounded-lg text-xs font-semibold border transition-all',
                  mode === 'block'
                    ? 'bg-red-500 text-white border-red-500'
                    : 'border-[var(--border)] text-[var(--mid)] hover:border-red-500')}>
                ✕ Block Off
              </button>
            </div>

            <button
              onClick={applyToSelected}
              disabled={selectedDates.size === 0 || isSaving}
              className="btn-primary w-full flex items-center justify-center gap-2 text-sm">
              {isSaving ? <Loader2 size={14} className="animate-spin" /> : null}
              Apply to {selectedDates.size} Day{selectedDates.size !== 1 ? 's' : ''}
            </button>

            {selectedDates.size > 0 && (
              <button onClick={() => setSelectedDates(new Set())}
                className="w-full text-xs text-[var(--muted)] hover:underline mt-2">
                Clear selection
              </button>
            )}
          </div>

          <div className="card p-4">
            <div className="text-sm font-bold mb-3">This Month Summary</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Available days</span>
                <span className="font-semibold text-green-600">
                  {Object.values(stateMap).filter(s => s === 'available').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Blocked days</span>
                <span className="font-semibold text-red-500">
                  {Object.values(stateMap).filter(s => s === 'blocked').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Booked days</span>
                <span className="font-semibold text-[var(--accent)]">
                  {Object.values(stateMap).filter(s => s === 'booked').length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
