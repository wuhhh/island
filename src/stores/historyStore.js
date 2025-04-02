import { create } from "zustand";
import { persist } from "zustand/middleware";
import { temporal } from "zundo";
import useStore from "./useStore";

// Get plane resolution
const resolution = useStore(state => state.planeSubdivisions);
console.log(`Plane resolution: ${resolution}`);

const useStoreWithUndo = create(
  persist(
    temporal(
      set => ({
        message: "Hello World",
        setMessage: message => {
          set({ message });
        },
      }),
      {
        wrapTemporal: storeInitializer => persist(storeInitializer, { name: "wuhhh/island:temporal-storage" }),
      }
    ),
    {
      name: "wuhhh/island:parent-storage",
    }
  )
);

export default useStoreWithUndo;
