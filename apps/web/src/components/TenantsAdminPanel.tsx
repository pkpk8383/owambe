'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatTimeAgo } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Globe, ExternalLink, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';

export function TenantsAdminPanel() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-tenants'],
    queryFn: () => api.get('/tenants').then(r => r.data),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/tenants/${id}/toggle`),
    onSuccess: () => {
      toast.success('Portal status updated');
      queryClient.invalidateQueries({ queryKey: ['admin-tenants'] });
    },
  });

  const tenants = data?.tenants || [];

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-[var(--muted)]" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Globe size={16} className="text-[var(--accent)]" />
          <h2 className="section-title">White-label Portals</h2>
          <span className="badge-upcoming">{tenants.length} portals</span>
        </div>
      </div>

      <div className="card overflow-hidden">
        {tenants.length === 0 ? (
          <div className="text-center py-8 text-sm text-[var(--muted)]">
            No white-label portals yet. Scale plan customers will appear here.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-[var(--border)]">
                <th className="table-header">Portal</th>
                <th className="table-header">Subdomain</th>
                <th className="table-header">Custom domain</th>
                <th className="table-header">Planner</th>
                <th className="table-header">Created</th>
                <th className="table-header">Status</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((t: any) => (
                <tr key={t.id} className="table-row">
                  <td className="table-cell">
                    <div className="font-semibold text-sm">{t.name}</div>
                    {t.tagline && <div className="text-xs text-[var(--muted)] truncate max-w-[160px]">{t.tagline}</div>}
                  </td>
                  <td className="table-cell">
                    <a href={`https://${t.subdomain}.owambe.com`} target="_blank" rel="noopener noreferrer"
                      className="text-xs font-mono text-[var(--accent)] hover:underline flex items-center gap-1">
                      {t.subdomain}.owambe.com <ExternalLink size={10} />
                    </a>
                  </td>
                  <td className="table-cell text-xs text-[var(--muted)]">
                    {t.customDomain || '—'}
                  </td>
                  <td className="table-cell text-xs text-[var(--muted)]">
                    {t.planner?.user?.email}
                  </td>
                  <td className="table-cell text-xs text-[var(--muted)]">
                    {formatTimeAgo(t.createdAt)}
                  </td>
                  <td className="table-cell">
                    <span className={t.isActive ? 'badge-live' : 'badge-cancelled'}>
                      {t.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="table-cell">
                    <button
                      onClick={() => toggleMutation.mutate(t.id)}
                      disabled={toggleMutation.isPending}
                      className="transition-colors text-[var(--muted)] hover:text-[var(--accent)]">
                      {t.isActive
                        ? <ToggleRight size={22} className="text-[var(--accent)]" />
                        : <ToggleLeft size={22} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
