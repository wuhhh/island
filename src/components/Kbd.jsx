export default function Kbd({ children, ...props }) {
  return (
    <kbd
      {...props}
      className='inline-flex items-center justify-center rounded-sm border border-gray-300 bg-white px-2 py-0.5 text-sm font-medium text-gray-700 shadow-sm'
    >
      {children}
    </kbd>
  );
}
