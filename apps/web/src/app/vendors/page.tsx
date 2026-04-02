'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { vendorsApi } from '@/lib/api';
import { formatNGN, VENDOR_CATEGORY_LABELS, VENDOR_CATEGORY_EMOJIS, NIGERIAN_CITIES } from '@/lib/utils';
import Link from 'next/link';
import { Search, Star, MapPin, Zap, SlidersHorizontal } from 'lucide-react';

const CATEGORIES = ['All', ...Object.keys(VENDOR_CATEGORY_LABELS)];

export default function VendorsPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [city, setCity] = useState('Lagos');
  const [sortBy, setSortBy] = useState('rating');
  const [maxBudget, setMaxBudget] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['vendors-search', { category, city, sortBy, maxBudget }],
    queryFn: () => vendorsApi.search({
      category: category || undefined,
      city,
      sortBy,
      maxBudget: maxBudget || undefined,
    }).then(r => r.data),
  });

  const vendors = (data?.vendors || []).filter((v: any) =>
    !search || v.businessName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-5 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--dark)] mb-2">Find Vendors in Lagos</h1>
        <p className="text-sm text-[var(--muted)]">
          {data?.total || 0} verified vendors ready to make your event unforgettable
        </p>
      </div>

      {/* Search & filters */}
      <div className="card p-4 mb-6">
        <div className="flex gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-1 min-w-[200px] bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2">
            <Search size={14} className="text-[var(--muted)]" />
            <input className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--muted)]"
              placeholder="Search vendors..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input w-auto text-sm" value={city} onChange={e => setCity(e.target.value)}>
            {NIGERIAN_CITIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <select className="input w-auto text-sm" value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="rating">Top Rated</option>
            <option value="bookings">Most Booked</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
          <input type="number" className="input w-36 text-sm"
            placeholder="Max budget (₦)"
            value={maxBudget} onChange={e => setMaxBudget(e.target.value)} />
        </div>
      </div>

      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6 pb-1">
        {CATEGORIES.map(cat => (
          <button key={cat}
            onClick={() => setCategory(cat === 'All' ? '' : cat)}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
              (cat === 'All' && !category) || category === cat
                ? 'bg-[var(--dark)] text-white border-[var(--dark)]'
                : 'bg-white border-[var(--border)] text-[var(--mid)] hover:border-[var(--accent)]'
            }`}>
            {cat !== 'All' && <span className="mr-1">{VENDOR_CATEGORY_EMOJIS[cat]}</span>}
            {cat === 'All' ? 'All' : VENDOR_CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Vendor grid */}
      {isLoading ? (
        <div className="grid grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="card h-[280px] animate-pulse bg-[var(--bg)]" />
          ))}
        </div>
      ) : vendors.length === 0 ? (
        <div className="text-center py-16 text-[var(--muted)]">
          <div className="text-4xl mb-3">🔍</div>
          <div className="font-semibold text-[var(--dark)] mb-1">No vendors found</div>
          <div className="text-sm">Try adjusting your filters</div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {vendors.map((vendor: any) => (
            <VendorCard key={vendor.id} vendor={vendor} />
          ))}
        </div>
      )}
    </div>
  );
}

function VendorCard({ vendor }: { vendor: any }) {
  const photo = vendor.portfolioItems?.[0]?.url;
  return (
    <Link href={`/vendors/${vendor.slug}`}>
      <div className="card overflow-hidden hover:shadow-lg transition-all cursor-pointer group">
        {/* Photo */}
        <div className="aspect-[4/3] bg-[var(--bg)] relative overflow-hidden">
          {photo ? (
            <img src={photo} alt={vendor.businessName}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl">
              {VENDOR_CATEGORY_EMOJIS[vendor.category] || '🏢'}
            </div>
          )}
          {vendor.isFeatured && (
            <div className="absolute top-2 left-2 bg-[var(--accent2)] text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
              ⭐ Featured
            </div>
          )}
          {vendor.isInstantBook && (
            <div className="absolute top-2 right-2 bg-[var(--dark)] text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <Zap size={9} /> Instant
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          <div className="text-[10px] text-[var(--muted)] font-semibold uppercase tracking-wide mb-1">
            {VENDOR_CATEGORY_EMOJIS[vendor.category]} {VENDOR_CATEGORY_LABELS[vendor.category]}
          </div>
          <div className="font-bold text-sm text-[var(--dark)] mb-1 truncate">{vendor.businessName}</div>
          <div className="flex items-center gap-1 text-xs text-[var(--muted)] mb-2">
            <MapPin size={10} /> {vendor.city}
          </div>
          {vendor.shortBio && (
            <div className="text-xs text-[var(--muted)] line-clamp-2 mb-3">{vendor.shortBio}</div>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Star size={12} className="text-yellow-400 fill-yellow-400" />
              <span className="text-xs font-semibold">{Number(vendor.rating).toFixed(1)}</span>
              <span className="text-[10px] text-[var(--muted)]">({vendor.reviewCount})</span>
            </div>
            <div className="text-xs font-bold text-[var(--accent)]">
              From {formatNGN(vendor.minPrice, true)}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
