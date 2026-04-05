'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/lib/api';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Loader2, Mail, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const mutation = useMutation({
    mutationFn: () => authApi.forgotPassword(email.toLowerCase().trim()),
    onSuccess: () => setSent(true),
    onError: (e: any) => toast.error(e.response?.data?.error || 'Request failed. Please try again.'),
  });

  if (sent) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center border border-[var(--border)]">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <Mail size={24} className="text-green-600" />
          </div>
          <h1 className="font-bold text-xl mb-2">Check your email</h1>
          <p className="text-sm text-[var(--muted)] mb-6">
            We sent a password reset link to <strong>{email}</strong>. It expires in 1 hour.
          </p>
          <Link href="/login" className="btn-primary w-full justify-center">← Back to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full border border-[var(--border)]">
        <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--dark)] mb-6 transition-colors">
          <ArrowLeft size={14} /> Back to login
        </Link>

        <h1 className="font-bold text-2xl mb-1">Reset your password</h1>
        <p className="text-sm text-[var(--muted)] mb-6">
          Enter your email and we'll send you a reset link.
        </p>

        <form onSubmit={(e) => { e.preventDefault(); if (email) mutation.mutate(); }}>
          <div className="mb-4">
            <label className="label">Email address</label>
            <input
              type="email" required
              className="input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <button type="submit" disabled={mutation.isPending || !email}
            className="btn-primary w-full justify-center py-3">
            {mutation.isPending && <Loader2 size={16} className="animate-spin" />}
            Send Reset Link
          </button>
        </form>
      </div>
    </div>
  );
}
