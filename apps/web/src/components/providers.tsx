'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';

function AuthHydrator() {
  useEffect(() => {
    // Ensure hydration flag is set after mount
    // This covers the case where onRehydrateStorage may not fire reliably
    const state = useAuthStore.getState();
    if (!state._hasHydrated) {
      if (state.accessToken) {
        api.defaults.headers.common['Authorization'] = `Bearer ${state.accessToken}`;
      }
      state.setHasHydrated(true);
    }
  }, []);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <AuthHydrator />
      {children}
    </QueryClientProvider>
  );
}
