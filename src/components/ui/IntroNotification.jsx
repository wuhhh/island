import { motion } from "framer-motion";

/**
 * Intro notification displayed on first visit
 * @param {Object} props
 * @param {boolean} props.show - Whether to show the notification
 * @param {Function} props.onDismiss - Function to dismiss the notification
 * @param {Function} props.onCreateNewIsland - Function to create a new island
 */
function IntroNotification({ show, onDismiss, onCreateNewIsland }) {
  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className='fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white shadow-md rounded-lg p-8 w-11/12 max-w-xl z-50 cursor-default'
    >
      <div className='text-left space-y-2 mb-3'>
        <p className='font-medium text-base'>🏝️ Model Island - Sculpt and decorate your own paradise 🏝️</p>
      </div>
      <p className='text-sm text-gray-700 mb-3'>
        Click the pencil button in the top left to try editing this one! If you're feeling brave you can create a new island from scratch by
        clicking the button below!
      </p>
      <div className='flex justify-between items-center'>
        <button onClick={onCreateNewIsland} className='btn'>
          Create New Island
        </button>
        <button onClick={onDismiss} className='btn-dotted !text-sm text-slate-600'>
          Dismiss
        </button>
      </div>
    </motion.div>
  );
}

export default IntroNotification;
