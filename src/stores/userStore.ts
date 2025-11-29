import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '@shared/types';
interface UserState {
  userId: string | null;
  userName: string | null;
  isLoggedIn: boolean;
  adminTokenExpiry: number | null;
  login: (user: User, isAdmin?: boolean) => void;
  logout: () => void;
  refreshAdminToken: () => void;
}
export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      userId: null,
      userName: null,
      isLoggedIn: false,
      adminTokenExpiry: null,
      login: (user, isAdmin = false) => {
        const update: Partial<UserState> = {
          userId: user.id,
          userName: user.name,
          isLoggedIn: true,
        };
        if (isAdmin) {
          update.adminTokenExpiry = Date.now() + 30 * 60 * 1000; // 30 minutes
        }
        set(update);
      },
      logout: () => set({ userId: null, userName: null, isLoggedIn: false, adminTokenExpiry: null }),
      refreshAdminToken: () => {
        const { adminTokenExpiry } = get();
        if (adminTokenExpiry && Date.now() > adminTokenExpiry) {
          set({ adminTokenExpiry: null });
          // In a real app, you'd trigger a re-login flow here.
          // For the demo, we just expire the token.
        }
      },
    }),
    {
      name: 'flagforge-user-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        userId: state.userId,
        userName: state.userName,
        isLoggedIn: state.isLoggedIn,
        adminTokenExpiry: state.adminTokenExpiry,
      }),
    }
  )
);
// Export typed primitive hooks to enforce best practices
export const useUserId = () => useUserStore(s => s.userId);
export const useIsLoggedIn = () => useUserStore(s => s.isLoggedIn);