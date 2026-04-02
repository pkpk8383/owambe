'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { vendorsApi } from '@/lib/api';
import { formatNGN } from '@/lib/utils';
import toast from 'react-hot-toast';
import { MapPin, Star, Users, Search, Zap } from 'lucide-react';

const LAGOS_AREAS = ['Victoria Island', 'Ikoyi', 'Lekki', 'Ikeja', 'Surulere', 'Yaba', 'Ajah', 'Mainland'];
const CAPACITIES = ['< 50', '50-100', '100-300', '300-500', '500+'];

export default function VenuePage() {
  const [area, setArea] = useState('Victoria Island');
  const [capacity, setCapacity] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['venues', area, maxBudget],
    queryFn: () => vendorsApi.search({
      category: 'VENUE',
      city: 'Lagos',
      maxBudget: maxBudget || undefined,
    }).then(r => r.data),
  });

  const venues = (data?.vendors || []).filter((v: any) =>
    !search || v.businessName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 animate-fade-up">
      {/* Search + filters */}
      <div className="card p-4 mb-5">
        <div className="flex gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-1 min-w-[160px] bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2">
            <Search size={13} className="text-[var(--muted)]" />
            <input className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--muted)]"
              placeholder="Search venues..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input w-auto text-sm" value={area} onChange={e => setArea(e.target.value)}>
            {LAGOS_AREAS.map(a => <option key={a}>{a}</option>)}
          </select>
          <select className="input w-auto text-sm" value={capacity} onChange={e => setCapacity(e.target.value)}>
            <option value="">Any capacity</option>
            {CAPACITIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <input type="number" className="input w-40 text-sm"
            placeholder="Max budget (₦)"
            value={maxBudget} onChange={e => setMaxBudget(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-[1fr_360px] gap-5">
        {/* Venue list */}
        <div>
          <div className="text-xs text-[var(--muted)] mb-3">
            {venues.length} venue{venues.length !== 1 ? 's' : ''} found in Lagos
          </div>
          <div className="space-y-3">
            {isLoading ? (
              Array(4).fill(0).map((_, i) => (
                <div key={i} className="card h-28 animate-pulse bg-[var(--bg)]" />
              ))
            ) : venues.length === 0 ? (
              <div className="card text-center py-10 text-[var(--muted)]">
                <MapPin size={28} className="mx-auto mb-2 text-[var(--border)]" />
                <div className="text-sm">No venues found. Try adjusting your filters.</div>
              </div>
            ) : (
              venues.map((v: any) => (
                <div key={v.id}
                  onClick={() => setSelected(v)}
                  className={`card p-4 flex gap-4 cursor-pointer hover:shadow-card transition-all ${selected?.id === v.id ? 'border-[var(--accent)]' : ''}`}>
                  <div className="w-20 h-20 rounded-xl bg-[var(--bg)] flex-shrink-0 overflow-hidden">
                    {v.portfolioItems?.[0]?.url ? (
                      <img src={v.portfolioItems[0].url} alt={v.businessName}
                        className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">🏛</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm mb-0.5">{v.businessName}</div>
                    <div className="flex items-center gap-2 text-xs text-[var(--muted)] mb-2">
                      <MapPin size={10} /> {v.address || v.city}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-xs">
                        <Star size={11} className="text-yellow-400 fill-yellow-400" />
                        <span className="font-semibold">{Number(v.rating).toFixed(1)}</span>
                        <span className="text-[var(--muted)]">({v.reviewCount})</span>
                      </div>
                      <div className="text-xs font-bold text-[var(--accent)]">
                        From {formatNGN(v.minPrice, true)}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); toast('Opening venue profile...'); }}
                    className="btn-primary text-xs px-3 self-center shrink-0">
                    View
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Detail panel */}
        <div>
          {selected ? (
            <div className="card overflow-hidden sticky top-20">
              <div className="aspect-video bg-[var(--bg)] overflow-hidden">
                {selected.portfolioItems?.[0]?.url ? (
                  <img src={selected.portfolioItems[0].url} alt={selected.businessName}
                    className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-5xl">🏛</div>
                )}
              </div>
              <div className="p-5">
                <div className="font-bold text-base mb-1">{selected.businessName}</div>
                <div className="flex items-center gap-1 text-xs text-[var(--muted)] mb-3">
                  <MapPin size={11} /> {selected.address || selected.city}
                </div>
                {selected.description && (
                  <p className="text-xs text-[var(--mid)] leading-relaxed mb-4 line-clamp-3">
                    {selected.description}
                  </p>
                )}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-[var(--bg)] rounded-lg p-3 text-center">
                    <div className="font-bold text-sm">{formatNGN(selected.minPrice, true)}</div>
                    <div className="text-[10px] text-[var(--muted)]">Starting price</div>
                  </div>
                  <div className="bg-[var(--bg)] rounded-lg p-3 text-center">
                    <div className="font-bold text-sm">{selected.reviewCount}</div>
                    <div className="text-[10px] text-[var(--muted)]">Reviews</div>
                  </div>
                </div>
                <button
                  onClick={() => toast('Sending RFQ to venue...')}
                  className="btn-accent w-full flex items-center justify-center gap-2 text-sm">
                  Send RFQ to This Venue →
                </button>
                <button
                  onClick={() => window.open(`/vendors/${selected.slug}`, '_blank')}
                  className="btn-secondary w-full mt-2 text-sm">
                  View Full Profile
                </button>
              </div>
            </div>
          ) : (
            <div className="card p-8 text-center text-[var(--muted)] sticky top-20">
              <div className="text-3xl mb-3">🗺</div>
              <div className="font-semibold text-[var(--dark)] mb-1">Select a venue</div>
              <div className="text-sm">Click any venue to see details and send an RFQ</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
