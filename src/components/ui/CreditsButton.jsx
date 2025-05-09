import React from "react";

/**
 * Button to show credits
 * @param {Object} props
 * @param {Function} props.onShowCredits - Function to show credits modal
 */
function CreditsButton({ onShowCredits }) {
  return (
    <div className='absolute bottom-[26px] right-12 w-[26px] h-[26px] flex items-center'>
      <button onClick={onShowCredits} className='btn-dotted text-white'>
        Credits
      </button>
    </div>
  );
}

export default CreditsButton;
