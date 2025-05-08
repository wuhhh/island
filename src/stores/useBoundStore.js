import { useEffect, useState } from "react";
import { create } from "zustand";
import { persist, subscribeWithSelector } from "zustand/middleware";

/**
 * Creates a persisted store with hydration tracking
 *
 * @param {Object} storeCreator - Function that creates the store state and actions
 * @param {Object} options - Configuration options
 * @param {string} options.name - Name of the store in storage
 * @param {Function} options.partialize - Function to determine which parts of state to persist
 * @param {Array} options.middlewares - Additional middlewares to apply before persist
 * @param {Object} options.middlewareOptions - Options for additional middlewares
 * @returns {Object} The created store with hydration utilities
 */
export const createBoundStore = (storeCreator, options) => {
  const { name, partialize = state => state, middlewares = [], middlewareOptions = {} } = options || {};

  // Create base store state with hydration tracking
  const baseState = (set, get) => ({
    // Hydration state
    _hasHydrated: false,
    setHasHydrated: state => {
      set({
        _hasHydrated: state,
      });
    },

    // Merge the user's store creator
    ...storeCreator(set, get),
  });

  // Apply middleware chain, starting with the base state
  let storeState = baseState;

  // Apply any additional middlewares in order
  middlewares.forEach(middleware => {
    const middlewareOpts = middlewareOptions[middleware.name] || {};
    storeState = middleware(storeState, middlewareOpts);
  });

  // Finally apply persist middleware
  const useStore = create()(
    subscribeWithSelector(
      persist(storeState, {
        name,
        partialize,
        onRehydrateStorage: () => state => {
          // This correctly waits for state to be available
          if (state) {
            state.setHasHydrated(true);
          }
        },
      })
    )
  );

  return useStore;
};

/**
 * Hook to track hydration status of a bound store
 *
 * @param {Object} boundStore - Store created with createBoundStore
 * @returns {boolean} Whether the store has been hydrated
 */
export const useHydration = boundStore => {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Optional: track when hydration starts
    const unsubHydrate = boundStore.persist.onHydrate(() => setHydrated(false));

    const unsubFinishHydration = boundStore.persist.onFinishHydration(() => setHydrated(true));

    // Set initial state
    setHydrated(boundStore.persist.hasHydrated());

    return () => {
      unsubHydrate();
      unsubFinishHydration();
    };
  }, [boundStore]);

  return hydrated;
};
