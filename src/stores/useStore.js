import { create } from "zustand";
import { persist } from "zustand/middleware";

const useStore = create(
  persist(
    set => ({
      sculptMode: false,
      setSculptMode: sculptMode => set({ sculptMode }),

      persisted: {
        wireframe: false,
      },

      actions: {
        setWireframe: wireframe => set(state => ({ persisted: { ...state.persisted, wireframe } })),
      },
    }),
    {
      name: "wuhhh/island",
      // Only persist the 'persisted' object
      partialize: state => ({ persisted: state.persisted }),
    }
  )
);

export default useStore;
