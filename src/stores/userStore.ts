import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '@shared/types';
interface UserState {
  userId: string | null;
  userName: string | null;
  isLoggedIn: boolean;
  login: (user: User) => void;
  logout: () => void;
}
export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      userId: null,
      userName: null,
      isLoggedIn: false,
      login: (user) => set({ userId: user.id, userName: user.name, isLoggedIn: true }),
      logout: () => set({ userId: null, userName: null, isLoggedIn: false }),
    }),
    {
      name: 'flagforge-user-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ userId: state.userId, userName: state.userName, isLoggedIn: state.isLoggedIn }),
    }
  )
);