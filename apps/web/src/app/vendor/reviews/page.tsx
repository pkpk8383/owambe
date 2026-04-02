'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vendorsApi, api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Star, MessageSquare, Loader2 } from 'lucide-react';

export default function VendorReviewsPage() {
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: profileData } = useQuery({
    queryKey: ['my-vendor-profile'],
    queryFn: () => vendorsApi.getMyProfile().then(r => r.data),
  });

  const { data: reviewsData, isLoading } = useQuery({
    queryKey: ['vendor-reviews'],
    queryFn: () => {
      const vendorId = profileData?.vendor?.id;
      return vendorId
        ? api.get(`/vendors/profile/${profileData.vendor.slug}`).then(r => r.data)
        : null;
    },
    enabled: !!profileData?.vendor,
  });

  const replyMutation = useMutation({
    mutationFn: ({ reviewId, response }: any) =>
      api.put(`/vendors/reviews/${reviewId}/reply`, { response }),
    onSuccess: () => {
      toast.success('Reply posted!');
      setReplyingTo(null);
      queryClient.invalidateQueries({ queryKey: ['vendor-reviews'] });
    },
  });

  const vendor = profileData?.vendor;
  const reviews = reviewsData?.vendor?.reviews || [];

  const avgRating = reviews.length
    ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length
    : 0;

  const ratingDist = [5, 4, 3, 2, 1].map(r => ({
    stars: r,
    count: reviews.filter((rev: any) => rev.rating === r).length,
  }));

  return (
    <div className="p-6 animate-fade-up">
      {/* Summary */}
      <div className="grid grid-cols-[auto_1fr] gap-6 card p-5 mb-5">
        <div className="text-center px-6">
          <div className="text-5xl font-bold text-[var(--dark)]">{avgRating.toFixed(1)}</div>
          <div className="flex justify-center mt-1 mb-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={14}
                className={i < Math.round(avgRating) ? 'text-yellow-400 fill-yellow-400' : 'text-[var(--border)]'} />
            ))}
          </div>
          <div className="text-xs text-[var(--muted)]">{reviews.length} reviews</div>
        </div>
        <div className="space-y-1.5">
          {ratingDist.map(r => (
            <div key={r.stars} className="flex items-center gap-2">
              <div className="text-xs text-[var(--muted)] w-8 text-right">{r.stars}★</div>
              <div className="flex-1 h-2 bg-[var(--border)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-400 rounded-full transition-all"
                  style={{ width: reviews.length > 0 ? `${(r.count / reviews.length) * 100}%` : '0%' }}
                />
              </div>
              <div className="text-xs text-[var(--muted)] w-5">{r.count}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Reviews list */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-[var(--muted)]" /></div>
      ) : reviews.length === 0 ? (
        <div className="card text-center py-12">
          <Star size={36} className="mx-auto mb-3 text-[var(--border)]" />
          <div className="font-bold text-[var(--dark)] mb-1">No reviews yet</div>
          <div className="text-sm text-[var(--muted)]">
            Complete bookings to start collecting verified reviews from clients.
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r: any) => (
            <div key={r.id} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={13}
                        className={i < r.rating ? 'text-yellow-400 fill-yellow-400' : 'text-[var(--border)]'} />
                    ))}
                    <div className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                      Verified Booking
                    </div>
                  </div>
                  {r.title && <div className="font-bold text-sm mb-1">{r.title}</div>}
                  {r.body && <div className="text-sm text-[var(--mid)] leading-relaxed">{r.body}</div>}
                </div>
                <div className="text-xs text-[var(--muted)] whitespace-nowrap ml-4">
                  {r.booking?.eventDate ? formatDate(r.booking.eventDate, 'MMM yyyy') : ''}
                </div>
              </div>

              {/* Vendor reply */}
              {r.response ? (
                <div className="bg-[var(--pill)] rounded-xl p-4 mt-3 border-l-4 border-[var(--accent)]">
                  <div className="text-[10px] font-bold text-[var(--accent)] uppercase tracking-wide mb-1">
                    Response from {vendor?.businessName}
                  </div>
                  <div className="text-sm text-[var(--mid)] leading-relaxed">{r.response}</div>
                  {r.respondedAt && (
                    <div className="text-[10px] text-[var(--muted)] mt-1">
                      {formatDate(r.respondedAt, 'MMM d, yyyy')}
                    </div>
                  )}
                </div>
              ) : (
                replyingTo === r.id ? (
                  <div className="mt-3 space-y-2">
                    <textarea
                      className="input text-sm min-h-[80px] resize-none"
                      placeholder="Write a professional response..."
                      value={replyText[r.id] || ''}
                      onChange={e => setReplyText(prev => ({ ...prev, [r.id]: e.target.value }))}
                    />
                    <div className="flex gap-2">
                      <button onClick={() => setReplyingTo(null)} className="btn-secondary text-xs flex-1">
                        Cancel
                      </button>
                      <button
                        onClick={() => replyMutation.mutate({ reviewId: r.id, response: replyText[r.id] })}
                        disabled={!replyText[r.id]?.trim() || replyMutation.isPending}
                        className="btn-primary text-xs flex-1 flex items-center justify-center gap-1.5">
                        {replyMutation.isPending && <Loader2 size={11} className="animate-spin" />}
                        Post Reply
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setReplyingTo(r.id)}
                    className="mt-3 flex items-center gap-1.5 text-xs text-[var(--accent)] font-semibold hover:underline">
                    <MessageSquare size={12} /> Reply to this review
                  </button>
                )
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
