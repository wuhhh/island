import React from "react";

import Kbd from "../Kbd";
import KeyBindingItem from "../KeyBindingItem";

/**
 * Modal for displaying keyboard shortcuts and help information
 * @param {Object} props
 * @param {boolean} props.show - Whether to show the modal
 * @param {Function} props.onClose - Function to close the modal
 */
function HelpModal({ show, onClose }) {
  if (!show) return null;

  return (
    <div role='dialog' aria-modal='true' className='fixed inset-0 bg-ocean/50 backdrop-blur-md flex justify-center items-center z-50'>
      <div className='bg-white rounded-lg shadow max-w-2xl w-full p-6'>
        <h2 className='text-xl font-semibold mb-4'>Tips & Shortcuts</h2>
        <div className='mb-4'>
          <h3 className='font-medium mb-4'>Keyboard Shortcuts:</h3>
          <ul className='list-outside list-none ml-0 space-y-1'>
            <li>
              <KeyBindingItem keyCombination={["e"]} action='Toggle edit mode' tag='span' />
            </li>
            <li>
              <KeyBindingItem keyCombination={["v"]} action='Move tool (Camera control)' tag='span' />
            </li>
            <li className='flex items-center gap-x-3'>
              <KeyBindingItem keyCombination={["a", "s"]} action='Raise / Lower terrain mode' separator=' ' tag='span' />
            </li>
            <li className='pt-2 pb-3 text-sm'>
              <strong className='text-blue-600'>Tip!</strong> In either terrain mode, hold <Kbd>Alt</Kbd> to quickly switch between modes.
              <br />
              Hold <Kbd>Ctrl</Kbd> to access the move tool and adjust the camera.
            </li>
            <li>
              <KeyBindingItem keyCombination={["[", "]"]} action='Make brush size smaller / bigger' separator=' ' tag='span' />
            </li>
            <li>
              <KeyBindingItem keyCombination={["-", "+"]} action='Make brush strength smaller / bigger' separator=' ' tag='span' />
            </li>
            <li>
              <KeyBindingItem keyCombination={["u", "y"]} action='Undo / Redo' tag='span' />
            </li>
            <li>
              <KeyBindingItem keyCombination={["Shift + R"]} action='Reset' tag='span' />
            </li>
          </ul>
        </div>
        <button
          onClick={onClose}
          className='cursor-pointer mt-2 px-4 py-2 bg-blue-600 text-white rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-400'
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default HelpModal;
