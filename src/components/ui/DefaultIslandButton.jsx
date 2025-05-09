import { Undo2 } from "lucide-react";
import React from "react";

import ToolTip from "./ToolTip";

/**
 * Button to load the default island
 * @param {Object} props
 * @param {Function} props.onLoadDefaultIsland - Function to load the default island
 */
function DefaultIslandButton({ onLoadDefaultIsland }) {
  return (
    <div className='absolute top-4 right-4 h-14 group'>
      <ToolTip position='left' offset={20}>
        <span className='text-sm'>Load Starter Island</span>
      </ToolTip>
      <button onClick={onLoadDefaultIsland} className='group/btn'>
        <span className='size-14 rounded-full bg-white shadow-md flex items-center justify-center relative'>
          <span className='size-[50px] rounded-full overflow-hidden'>
            <img
              src='/island/images/island-preview@2x.jpg'
              alt='Revert to Starter Island'
              className='w-full h-full object-cover transition-transform duration-500 group-hover/btn:scale-110'
            />
          </span>
          <span className='size-5 absolute top-1/2 -translate-y-1/2 left-0 -translate-x-3 bg-gradient-to-b from-[#2D5CF2] to-[#2A50C7] rounded-full flex items-center justify-center'>
            <Undo2 className='-scale-x-100' size={12} stroke='white' strokeWidth={2} />
          </span>
        </span>
      </button>
    </div>
  );
}

export default DefaultIslandButton;
