'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Globe, Palette, Upload, Eye, Copy, CheckCircle,
  Loader2, ExternalLink, Sparkles, Lock, Settings
} from 'lucide-react';

const FONT_OPTIONS = [
  'Inter', 'Poppins', 'Roboto', 'DM Sans', 'Sora', 'Nunito',
  'Outfit', 'Plus Jakarta Sans', 'Space Grotesk', 'Raleway',
];

const TABS = ['Branding', 'Content', 'Domain', 'Advanced'] as const;
type Tab = typeof TABS[number];

function ColorPicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <input
          type="color"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          title={label}
        />
        <div className="w-9 h-9 rounded-lg border border-[var(--border)] cursor-pointer"
          style={{ background: value }} />
      </div>
      <div className="flex-1">
        <label className="label">{label}</label>
        <input className="input text-xs font-mono py-1.5 mt-1" value={value}
          onChange={e => /^#[0-9A-Fa-f]{0,6}$/.test(e.target.value) && onChange(e.target.value)} />
      </div>
    </div>
  );
}

export default function WhiteLabelPage() {
  const [activeTab, setActiveTab] = useState<Tab>('Branding');
  const [isCreating, setIsCreating] = useState(false);
  const [newSubdomain, setNewSubdomain] = useState('');
  const [newName, setNewName] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['my-tenant'],
    queryFn: () => api.get('/tenants/me').then(r => r.data),
  });

  const tenant = data?.tenant;

  const [form, setForm] = useState<any>(null);

  // Populate form when tenant loads
  if (tenant && !form) {
    setForm({
      name: tenant.name,
      tagline: tenant.tagline || '',
      logoUrl: tenant.logoUrl || '',
      primaryColor: tenant.primaryColor,
      accentColor: tenant.accentColor,
      bgColor: tenant.bgColor,
      fontFamily: tenant.fontFamily,
      footerText: tenant.footerText || '',
      metaTitle: tenant.metaTitle || '',
      metaDescription: tenant.metaDescription || '',
      customDomain: tenant.customDomain || '',
      socialLinks: tenant.socialLinks || { twitter: '', instagram: '', linkedin: '', website: '' },
      allowPublicReg: tenant.allowPublicReg,
      requireApproval: tenant.requireApproval,
      customCss: tenant.customCss || '',
    });
  }

  const createMutation = useMutation({
    mutationFn: () => api.post('/tenants', {
      subdomain: newSubdomain.trim().toLowerCase(),
      name: newName.trim(),
    }),
    onSuccess: () => {
      toast.success('🎉 Portal created! Your subdomain is live.');
      queryClient.invalidateQueries({ queryKey: ['my-tenant'] });
      setIsCreating(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to create portal'),
  });

  const updateMutation = useMutation({
    mutationFn: () => api.put('/tenants/me', form),
    onSuccess: () => {
      toast.success('✅ Portal updated!');
      queryClient.invalidateQueries({ queryKey: ['my-tenant'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Update failed'),
  });

  const portalUrl = tenant
    ? `https://${tenant.subdomain}.owambe.com`
    : null;

  function copyUrl() {
    if (portalUrl) {
      navigator.clipboard.writeText(portalUrl);
      toast.success('URL copied!');
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 flex justify-center py-12">
        <Loader2 size={24} className="animate-spin text-[var(--muted)]" />
      </div>
    );
  }

  // Scale plan required check
  if (data && !tenant && !isCreating) {
    return (
      <div className="p-6 animate-fade-up">
        {/* Plan gate — offer upgrade if not Scale */}
        <div className="card text-center py-14 max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-[var(--accent2)]/10 flex items-center justify-center mx-auto mb-4">
            <Globe size={28} className="text-[var(--accent2)]" />
          </div>
          <h2 className="font-bold text-xl mb-2">White-label Portal</h2>
          <p className="text-sm text-[var(--muted)] mb-6 max-w-sm mx-auto leading-relaxed">
            Give your clients a branded event portal on your own subdomain —
            your logo, your colours, your events. Requires the Scale plan.
          </p>

          <div className="grid grid-cols-3 gap-3 mb-8 text-left">
            {[
              { icon: '🌐', title: 'Custom subdomain', desc: 'yourname.owambe.com' },
              { icon: '🎨', title: 'Full branding', desc: 'Logo, colours, fonts' },
              { icon: '🔗', title: 'Custom domain', desc: 'events.yoursite.com' },
            ].map(f => (
              <div key={f.title} className="bg-[var(--bg)] rounded-xl p-3 border border-[var(--border)]">
                <div className="text-xl mb-1.5">{f.icon}</div>
                <div className="font-semibold text-xs">{f.title}</div>
                <div className="text-[11px] text-[var(--muted)] mt-0.5">{f.desc}</div>
              </div>
            ))}
          </div>

          <button onClick={() => setIsCreating(true)}
            className="btn-accent text-sm px-8 py-3 flex items-center gap-2 mx-auto">
            <Sparkles size={15} /> Create My Portal
          </button>
          <p className="text-xs text-[var(--muted)] mt-3">Included in Scale plan · ₦450,000/month</p>
        </div>
      </div>
    );
  }

  // Create portal form
  if (isCreating) {
    return (
      <div className="p-6 animate-fade-up">
        <div className="card max-w-md mx-auto p-7">
          <h2 className="font-bold text-lg mb-1">Create your portal</h2>
          <p className="text-sm text-[var(--muted)] mb-6">
            Choose a subdomain — this is permanent and can't be changed later.
          </p>
          <div className="mb-4">
            <label className="label">Portal name</label>
            <input className="input text-sm" value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="TechLagos Events" />
          </div>
          <div className="mb-4">
            <label className="label">Subdomain</label>
            <div className="flex items-center border-1.5 border-[var(--border)] rounded-lg overflow-hidden">
              <input className="input text-sm flex-1 border-0 rounded-none font-mono"
                value={newSubdomain}
                onChange={e => setNewSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="techlagos" />
              <span className="px-3 text-[var(--muted)] text-sm bg-[var(--bg)] h-full flex items-center border-l border-[var(--border)] whitespace-nowrap">
                .owambe.com
              </span>
            </div>
            {newSubdomain && (
              <p className="text-xs text-[var(--accent)] mt-1.5 font-semibold">
                → https://{newSubdomain}.owambe.com
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setIsCreating(false)} className="btn-secondary flex-1">Cancel</button>
            <button
              onClick={() => createMutation.mutate()}
              disabled={!newSubdomain || !newName || createMutation.isPending}
              className="btn-primary flex-1 flex items-center justify-center gap-2">
              {createMutation.isPending && <Loader2 size={13} className="animate-spin" />}
              Create Portal
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!tenant || !form) return null;

  return (
    <div className="p-6 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-bold text-lg">{tenant.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-[var(--muted)] font-mono">{portalUrl}</span>
            <button onClick={copyUrl} className="text-[var(--muted)] hover:text-[var(--accent)] transition-colors">
              <Copy size={12} />
            </button>
            <a href={portalUrl!} target="_blank" rel="noopener noreferrer"
              className="text-[var(--muted)] hover:text-[var(--accent)] transition-colors">
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
        <div className="flex gap-2">
          <a href={portalUrl!} target="_blank" rel="noopener noreferrer"
            className="btn-secondary text-xs flex items-center gap-1.5">
            <Eye size={12} /> Preview
          </a>
          <button
            onClick={() => updateMutation.mutate()}
            disabled={updateMutation.isPending}
            className="btn-primary text-xs flex items-center gap-1.5">
            {updateMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
            Save Changes
          </button>
        </div>
      </div>

      {/* Status bar */}
      <div className="card p-3 mb-5 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-xs font-semibold text-green-600">Portal live</span>
        </div>
        <div className="h-4 w-px bg-[var(--border)]" />
        <span className="text-xs text-[var(--muted)]">
          Subdomain: <span className="font-mono font-semibold text-[var(--dark)]">{tenant.subdomain}</span>
        </span>
        {tenant.customDomain && (
          <>
            <div className="h-4 w-px bg-[var(--border)]" />
            <span className="text-xs text-[var(--muted)]">
              Custom domain: <span className="font-semibold text-[var(--dark)]">{tenant.customDomain}</span>
            </span>
          </>
        )}
      </div>

      <div className="grid grid-cols-[200px_1fr] gap-5">
        {/* Tab sidebar */}
        <div className="space-y-1">
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === tab
                  ? 'bg-[var(--dark)] text-white'
                  : 'text-[var(--muted)] hover:text-[var(--dark)] hover:bg-[var(--bg)]'
              }`}>
              {tab === 'Branding' && <Palette size={14} />}
              {tab === 'Content' && <Globe size={14} />}
              {tab === 'Domain' && <Settings size={14} />}
              {tab === 'Advanced' && <Lock size={14} />}
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div>
          {activeTab === 'Branding' && (
            <div className="space-y-5">
              {/* Logo upload */}
              <div className="card p-5">
                <h3 className="font-bold text-sm mb-4">Logo & Identity</h3>
                <div className="flex items-start gap-6">
                  <div className="w-24 h-24 rounded-xl border border-[var(--border)] bg-[var(--bg)] flex items-center justify-center overflow-hidden flex-shrink-0">
                    {form.logoUrl ? (
                      <img src={form.logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                    ) : (
                      <Globe size={28} className="text-[var(--border)]" />
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="label">Logo URL</label>
                    <input className="input text-sm mb-2" value={form.logoUrl}
                      onChange={e => setForm((p: any) => ({ ...p, logoUrl: e.target.value }))}
                      placeholder="https://yoursite.com/logo.png" />
                    <p className="text-xs text-[var(--muted)]">
                      Recommended: SVG or PNG, transparent background, min 200px wide
                    </p>
                  </div>
                </div>
              </div>

              {/* Colors */}
              <div className="card p-5">
                <h3 className="font-bold text-sm mb-4">Brand Colours</h3>
                <div className="grid grid-cols-3 gap-4">
                  <ColorPicker label="Primary colour"
                    value={form.primaryColor}
                    onChange={v => setForm((p: any) => ({ ...p, primaryColor: v }))} />
                  <ColorPicker label="Accent colour"
                    value={form.accentColor}
                    onChange={v => setForm((p: any) => ({ ...p, accentColor: v }))} />
                  <ColorPicker label="Background colour"
                    value={form.bgColor}
                    onChange={v => setForm((p: any) => ({ ...p, bgColor: v }))} />
                </div>
                {/* Preview swatch */}
                <div className="mt-4 rounded-xl overflow-hidden border border-[var(--border)]">
                  <div style={{ background: form.primaryColor, padding: '12px 16px' }}>
                    <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>Your portal name</div>
                    <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 2 }}>Tagline preview</div>
                  </div>
                  <div style={{ background: form.bgColor, padding: 12, display: 'flex', gap: 8 }}>
                    <div style={{ background: form.primaryColor, color: '#fff', padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 700 }}>
                      Register
                    </div>
                    <div style={{ background: form.accentColor, color: '#fff', padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 700 }}>
                      Book Now
                    </div>
                  </div>
                </div>
              </div>

              {/* Typography */}
              <div className="card p-5">
                <h3 className="font-bold text-sm mb-4">Typography</h3>
                <label className="label">Font family</label>
                <select className="input text-sm" value={form.fontFamily}
                  onChange={e => setForm((p: any) => ({ ...p, fontFamily: e.target.value }))}>
                  {FONT_OPTIONS.map(f => <option key={f}>{f}</option>)}
                </select>
                <p className="text-xs text-[var(--muted)] mt-1.5">
                  Loaded from Google Fonts automatically
                </p>
              </div>
            </div>
          )}

          {activeTab === 'Content' && (
            <div className="space-y-5">
              <div className="card p-5">
                <h3 className="font-bold text-sm mb-4">Portal Details</h3>
                <div className="space-y-4">
                  <div>
                    <label className="label">Portal name</label>
                    <input className="input text-sm" value={form.name}
                      onChange={e => setForm((p: any) => ({ ...p, name: e.target.value }))}
                      placeholder="TechLagos Events" />
                  </div>
                  <div>
                    <label className="label">Tagline</label>
                    <input className="input text-sm" value={form.tagline}
                      onChange={e => setForm((p: any) => ({ ...p, tagline: e.target.value }))}
                      placeholder="Nigeria's leading tech conference platform" />
                  </div>
                  <div>
                    <label className="label">Footer text</label>
                    <input className="input text-sm" value={form.footerText}
                      onChange={e => setForm((p: any) => ({ ...p, footerText: e.target.value }))}
                      placeholder="© 2026 TechLagos. All rights reserved." />
                  </div>
                </div>
              </div>

              <div className="card p-5">
                <h3 className="font-bold text-sm mb-4">SEO & Social</h3>
                <div className="space-y-3">
                  <div>
                    <label className="label">Page title</label>
                    <input className="input text-sm" value={form.metaTitle}
                      onChange={e => setForm((p: any) => ({ ...p, metaTitle: e.target.value }))}
                      placeholder="TechLagos Events — Nigeria's Tech Hub" />
                  </div>
                  <div>
                    <label className="label">Meta description</label>
                    <textarea className="input text-sm min-h-[70px] resize-none" value={form.metaDescription}
                      onChange={e => setForm((p: any) => ({ ...p, metaDescription: e.target.value }))}
                      placeholder="Discover and register for tech events in Nigeria..." />
                  </div>
                </div>
              </div>

              <div className="card p-5">
                <h3 className="font-bold text-sm mb-4">Social Links</h3>
                <div className="grid grid-cols-2 gap-3">
                  {['twitter', 'instagram', 'linkedin', 'website'].map(platform => (
                    <div key={platform}>
                      <label className="label capitalize">{platform}</label>
                      <input className="input text-sm"
                        value={form.socialLinks?.[platform] || ''}
                        onChange={e => setForm((p: any) => ({
                          ...p,
                          socialLinks: { ...p.socialLinks, [platform]: e.target.value }
                        }))}
                        placeholder={`https://${platform}.com/...`} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Domain' && (
            <div className="space-y-5">
              <div className="card p-5">
                <h3 className="font-bold text-sm mb-1">Owambe Subdomain</h3>
                <p className="text-xs text-[var(--muted)] mb-4">
                  Your subdomain is permanent and cannot be changed after creation.
                </p>
                <div className="flex items-center gap-3 bg-[var(--bg)] rounded-lg px-4 py-3 border border-[var(--border)]">
                  <span className="font-mono font-bold text-[var(--dark)]">{tenant.subdomain}</span>
                  <span className="text-[var(--muted)]">.owambe.com</span>
                  <div className="ml-auto flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    <span className="text-xs text-green-600 font-semibold">Active</span>
                  </div>
                </div>
              </div>

              <div className="card p-5">
                <h3 className="font-bold text-sm mb-1">Custom Domain</h3>
                <p className="text-xs text-[var(--muted)] mb-4">
                  Point your own domain to your portal. Requires a DNS CNAME record.
                </p>
                <div>
                  <label className="label">Custom domain</label>
                  <input className="input text-sm mb-2" value={form.customDomain}
                    onChange={e => setForm((p: any) => ({ ...p, customDomain: e.target.value }))}
                    placeholder="events.techlagos.com" />
                </div>

                {form.customDomain && (
                  <div className="bg-[var(--bg)] rounded-lg p-4 border border-[var(--border)] mt-3">
                    <p className="text-xs font-bold text-[var(--dark)] mb-2">
                      Add this DNS record at your domain registrar:
                    </p>
                    <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                      <div>
                        <div className="text-[var(--muted)] mb-1">Type</div>
                        <div className="font-bold">CNAME</div>
                      </div>
                      <div>
                        <div className="text-[var(--muted)] mb-1">Name</div>
                        <div className="font-bold">{form.customDomain.split('.')[0]}</div>
                      </div>
                      <div>
                        <div className="text-[var(--muted)] mb-1">Value</div>
                        <div className="font-bold">{tenant.subdomain}.owambe.com</div>
                      </div>
                    </div>
                    <p className="text-xs text-[var(--muted)] mt-3">
                      DNS propagation takes up to 48 hours. SSL is provisioned automatically by Vercel.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'Advanced' && (
            <div className="space-y-5">
              <div className="card p-5">
                <h3 className="font-bold text-sm mb-4">Registration Settings</h3>
                <div className="space-y-3">
                  <label className="flex items-center justify-between gap-4 cursor-pointer">
                    <div>
                      <div className="font-semibold text-sm">Public registration</div>
                      <div className="text-xs text-[var(--muted)] mt-0.5">Anyone can register for events without an account</div>
                    </div>
                    <div
                      onClick={() => setForm((p: any) => ({ ...p, allowPublicReg: !p.allowPublicReg }))}
                      className={`w-11 h-6 rounded-full transition-colors cursor-pointer relative ${form.allowPublicReg ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'}`}>
                      <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${form.allowPublicReg ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </div>
                  </label>
                  <div className="border-t border-[var(--border)]" />
                  <label className="flex items-center justify-between gap-4 cursor-pointer">
                    <div>
                      <div className="font-semibold text-sm">Require approval</div>
                      <div className="text-xs text-[var(--muted)] mt-0.5">Manually approve registrations before they're confirmed</div>
                    </div>
                    <div
                      onClick={() => setForm((p: any) => ({ ...p, requireApproval: !p.requireApproval }))}
                      className={`w-11 h-6 rounded-full transition-colors cursor-pointer relative ${form.requireApproval ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'}`}>
                      <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${form.requireApproval ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </div>
                  </label>
                </div>
              </div>

              <div className="card p-5">
                <h3 className="font-bold text-sm mb-1">Custom CSS</h3>
                <p className="text-xs text-[var(--muted)] mb-3">
                  Advanced: inject CSS to further customise your portal. Use with care.
                </p>
                <textarea
                  className="input text-xs font-mono min-h-[160px] resize-none"
                  value={form.customCss}
                  onChange={e => setForm((p: any) => ({ ...p, customCss: e.target.value }))}
                  placeholder={`.card { border-radius: 20px; }\n.btn-primary { border-radius: 9999px; }\n:root { --brand-primary: #4F46E5; }`}
                />
              </div>

              <div className="card p-4 bg-yellow-50 border-yellow-200">
                <div className="flex gap-3">
                  <span className="text-lg">⚠️</span>
                  <div>
                    <div className="font-semibold text-sm text-yellow-800">Danger zone</div>
                    <p className="text-xs text-yellow-700 mt-1 mb-3">
                      Disabling your portal will take it offline immediately. All event URLs will return 404 until re-enabled.
                    </p>
                    <button
                      onClick={() => {
                        if (confirm('Disable your portal? This takes it offline immediately.')) {
                          toast('Contact support to disable your portal.');
                        }
                      }}
                      className="text-xs font-bold text-red-600 hover:underline">
                      Disable portal
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
