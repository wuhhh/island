import React, { useRef, useEffect } from "react";
import { Trees } from "lucide-react";
import { useDecorRegistry } from "../hooks/useDecorRegistry.jsx";
import { useIslandStore } from "../stores/useIslandStore.js";

/**
 * MegaPlaceDecorButton component for placing decorative items on the island
 * This is a standalone component that replaced the old decor-select tool in the main toolbar
 */
export default function MegaPlaceDecorButton() {
  const decorRegistry = useDecorRegistry();
  const ref = useRef(null);

  const activeTool = useIslandStore(state => state.activeTool);
  const place = useIslandStore(state => state.place);
  const decorSelect = place.decorSelect;
  const setPlaceProp = useIslandStore(state => state.actions.setPlaceProp);
  const setSculptProp = useIslandStore(state => state.actions.setSculptProp);
  const setActiveTool = useIslandStore(state => state.actions.setActiveTool);

  // Click away
  useEffect(() => {
    const handleClickOutside = e => {
      if (decorSelect && ref.current && !ref.current.contains(e.target)) {
        setPlaceProp("decorSelect", false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [decorSelect, setPlaceProp]);

  // Toggle decor selection panel
  const handleClick = () => setPlaceProp("decorSelect", !decorSelect);

  // Set item
  const handleClickItem = item => {
    setActiveTool("decor-select");
    setSculptProp("active", false);
    setPlaceProp("item", item);
    setPlaceProp("decorSelect", false);
    setPlaceProp("active", true);
  };

  return (
    <div ref={ref} className='relative'>
      <button onClick={handleClick} className='absolute bottom-[19px] left-1/2 -translate-x-1/2' aria-label='Place decorative items'>
        <span className='relative block size-[69px]'>
          <span className='absolute top-0 left-1/2 -translate-x-3 -translate-y-2 size-6 bg-white rounded-full' />
          <span className='relative block w-full h-full p-0.5 content-center bg-white rounded-full'>
            <span
              className={`block w-full h-full content-center bg-gradient-to-b from-[#2D5CF2] via-30% to-[#2A50C7] rounded-full ${
                activeTool === "decor-select" || decorSelect ? "ring-4 ring-white/30" : ""
              }`}
            >
              <Trees className='mx-auto' size={32} color='white' strokeWidth={1.5} />
            </span>
          </span>
          <span className='absolute top-1 left-1/2 -translate-x-2.5 -translate-y-2 size-5 bg-white/20 rounded-full content-center' />
          <span className='absolute top-0.5 left-1/2 -translate-x-2.5 -translate-y-2 size-5 bg-gradient-to-b from-[#2D5CF2] to-[#2A50C7] rounded-full content-center'>
            <span className='relative content-center w-full h-full'>
              <span className='block w-2 h-[0.09375rem] rounded-full bg-white mx-auto' />
              <span className='absolute top-0 -left-1 rotate-90 block w-2 h-[0.09375rem] rounded-full bg-white mx-auto' />
            </span>
          </span>
        </span>
      </button>

      {decorSelect && (
        <div className='absolute bottom-28 left-1/2 transform -translate-x-1/2 w-[320px] p-3 bg-slate-50 shadow-lg text-sm rounded-2xl'>
          <div className='flex flex-wrap items-center justify-center gap-x-3 gap-y-4'>
            {Object.entries(decorRegistry)
              .filter(([_, { Icon }]) => Icon)
              .map(([key, { Icon, defaultIconProps }]) => (
                <button
                  key={key}
                  onClick={() => handleClickItem(key)}
                  className='cursor-pointer group/icon hover:scale-110 transition-transform'
                >
                  <Icon {...defaultIconProps} />
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
