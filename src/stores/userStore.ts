import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '@shared/types';
interface UserState {
  userId: string | null;
  userName: string | null;
  isLoggedIn: boolean;
  adminToken: string | null;
  adminTokenExpiry: number | null;
  login: (user: User, isAdmin?: boolean, token?: string) => void;
  logout: () => void;
  refreshAdminToken: () => void;
}
export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      userId: null,
      userName: null,
      isLoggedIn: false,
      adminToken: null,
      adminTokenExpiry: null,
      login: (user, isAdmin = false, token = null) => {
        const update: Partial<UserState> = {
          userId: user.id,
          userName: user.name,
          isLoggedIn: true,
        };
        if (isAdmin && token) {
          update.adminToken = token;
          update.adminTokenExpiry = Date.now() + 30 * 60 * 1000; // 30 minutes
        }
        set(update);
      },
      logout: () => set({
        userId: null,
        userName: null,
        isLoggedIn: false,
        adminToken: null,
        adminTokenExpiry: null
      }),
      refreshAdminToken: () => {
        const adminTokenExpiry = get().adminTokenExpiry;
        if (adminTokenExpiry && Date.now() > adminTokenExpiry) {
          set({ adminToken: null, adminTokenExpiry: null });
        }
      },
    }),
    {
      name: 'master-the-cloud-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        userId: state.userId,
        userName: state.userName,
        isLoggedIn: state.isLoggedIn,
        adminToken: state.adminToken,
        adminTokenExpiry: state.adminTokenExpiry,
      }),
    }
  )
);
// Export typed primitive hooks to enforce best practices
export const useUserId = () => useUserStore(s => s.userId);
export const useIsLoggedIn = () => useUserStore(s => s.isLoggedIn);
export const useAdminToken = () => useUserStore(s => s.adminToken);