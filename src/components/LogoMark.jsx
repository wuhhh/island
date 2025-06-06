export default function LogoMark() {
  return (
    <a
      href='https://huwroberts.net'
      target='_blank'
      aria-label='Made by Huw Roberts'
      className='logomark transition duration-200 text-white cursor-pointer before:absolute before:-inset-4 hover:text-black'
    >
      <svg className='pointer-events-none relative z-30' xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 100 100'>
        <path stroke='currentColor' strokeWidth='6' d='M3 3h94v94H3z' />
        <path fill='currentColor' d='M59.4 32v15.2H40.45V32H34v35.25h6.45V52.8H59.4v14.45h6.4V32h-6.4Z' />
      </svg>
    </a>
  );
}
