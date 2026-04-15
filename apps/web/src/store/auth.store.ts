import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { api } from '@/lib/api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'PLANNER' | 'VENDOR' | 'CONSUMER' | 'ADMIN';
  avatarUrl?: string;
  isEmailVerified: boolean;
  profile?: any;
  planner?: { plan: 'STARTER' | 'GROWTH' | 'SCALE'; id: string; companyName?: string };
  vendor?: any;
  consumer?: any;
}

// Helper: get current planner plan tier
export function getPlanTier(user: User | null): 'STARTER' | 'GROWTH' | 'SCALE' {
  return user?.planner?.plan ?? 'STARTER';
}

export function planAtLeast(user: User | null, required: 'GROWTH' | 'SCALE'): boolean {
  const tier = getPlanTier(user);
  const order = { STARTER: 0, GROWTH: 1, SCALE: 2 };
  return order[tier] >= order[required];
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isLoading: false,
      isAuthenticated: false,

      setAuth: (user, accessToken) => {
        set({ user, accessToken, isAuthenticated: true });
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      },

      clearAuth: () => {
        set({ user: null, accessToken: null, isAuthenticated: false });
        delete api.defaults.headers.common['Authorization'];
      },

      setLoading: (isLoading) => set({ isLoading }),

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const res = await api.post('/auth/login', { email, password });
          const { user, accessToken } = res.data;
          get().setAuth(user, accessToken);
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        try {
          await api.post('/auth/logout');
        } catch {
          // ignore
        } finally {
          get().clearAuth();
        }
      },

      refreshUser: async () => {
        try {
          const res = await api.get('/auth/me');
          set((state) => ({
            user: { ...state.user!, ...res.data.user }
          }));
        } catch {
          get().clearAuth();
        }
      },
    }),
    {
      name: 'owambe-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.accessToken) {
          api.defaults.headers.common['Authorization'] = `Bearer ${state.accessToken}`;
        }
      },
    }
  )
);
