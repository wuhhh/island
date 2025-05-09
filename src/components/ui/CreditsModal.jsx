/**
 * Modal for displaying credits and attribution information
 * @param {Object} props
 * @param {boolean} props.show - Whether to show the modal
 * @param {Function} props.onClose - Function to close the modal
 */
function CreditsModal({ show, onClose }) {
  if (!show) return null;

  return (
    <div role='dialog' aria-modal='true' className='fixed inset-0 bg-ocean/50 backdrop-blur-md flex justify-center items-center z-50 prose'>
      <div className='bg-white rounded-lg shadow max-w-xl w-full p-6'>
        <h2 className='text-xl font-semibold mb-4'>Credits</h2>
        <div className='mb-4'>
          <p>
            Model Island is work in progress by Huw Roberts. You can find more of my creations at{" "}
            <a href='https://huwroberts.net' target='_blank'>
              huwroberts.net
            </a>{" "}
            or follow me on{" "}
            <a href='https://bsky.app/profile/huwroberts.net' target='_blank' rel='noopener noreferrer'>
              Bluesky
            </a>
            .
          </p>
        </div>
        <div className='mb-4'>
          <h3 className='font-medium mb-4'>Models:</h3>
          <p>
            <ul className='list-disc list-inside'>
              <li>
                <a href='https://poly.pizza/m/XMvD3AilGv' target='_blank' rel='noopener noreferrer'>
                  Tree Fall - Kenney
                </a>
                <li>
                  <a href='https://poly.pizza/m/bN9Oz3niNm' target='_blank' rel='noopener noreferrer'>
                    Dock Long - Quaternius
                  </a>
                </li>
                <li>
                  <a href='https://poly.pizza/m/6I2DF2AZDgB' target='_blank' rel='noopener noreferrer'>
                    Wind Turbine - Poly by Google
                  </a>
                </li>
                <li>
                  <a href='https://poly.pizza/m/LrTs3hVGXv' target='_blank' rel='noopener noreferrer'>
                    Tent - Kenney
                  </a>
                </li>
              </li>
            </ul>
          </p>
        </div>
        <div className='mb-4'>
          <h3 className='font-medium mb-4'>Icons:</h3>
          <p>
            <a href='https://lucide.dev/' target='_blank'>
              Lucide Icons
            </a>
          </p>
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

export default CreditsModal;
