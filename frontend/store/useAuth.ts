import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Role } from '@/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  
  // Actions
  login: (access: string, refresh: string, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
  setAccessToken: (token: string) => void;
  hasRole: (role: Role) => boolean;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      login: (access, refresh, user) => set({ 
        accessToken: access, 
        refreshToken: refresh, 
        user, 
        isAuthenticated: true 
      }),

      logout: () => {
        localStorage.removeItem('auth-storage'); // Limpieza manual drástica
        set({ 
          user: null, 
          accessToken: null, 
          refreshToken: null, 
          isAuthenticated: false 
        });
      },

      updateUser: (user) => set({ user }),

      setAccessToken: (token) => set({ accessToken: token }),

      hasRole: (role) => {
        const currentUser = get().user;
        if (!currentUser || !currentUser.profile) return false;
        return currentUser.profile.role === role;
      }
    }),
    {
      name: 'auth-storage', // name of the item in the storage (must be unique)
      // Only keep tokens and user, skip functions
      partialize: (state) => ({ 
        accessToken: state.accessToken, 
        refreshToken: state.refreshToken, 
        user: state.user,
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);
