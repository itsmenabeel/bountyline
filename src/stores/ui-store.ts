import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface UiState {
  /** Desktop sidebar expanded (true) or collapsed to the icon rail (false). */
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

/**
 * Client UI preferences that outlive a page load. `skipHydration` keeps the first client
 * render identical to the server render (sidebar expanded); DashboardShell calls
 * `rehydrate()` after mount, so a saved collapsed state applies without a hydration mismatch.
 */
export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
    }),
    {
      name: "bountyline-ui",
      storage: createJSONStorage(() => localStorage),
      partialize: ({ sidebarOpen }) => ({ sidebarOpen }),
      skipHydration: true,
    },
  ),
);
