import React from 'react'
import Link from 'next/link';
import { FaUser } from 'react-icons/fa6'

const Navbar = () => {
  return (
    <nav className='lg:w-1/2 md:w-3/4 w-full p-2 px-2 bg-gray-300 flex items-center justify-between md:rounded-full my-1 sticky top-0 transition-all ease-in-out'>
      <Link href='/' className='w-[40px] h-[40px] flex items-center justify-center font-bold text-[32px] rounded-full mask-radial-from-neutral-500  bg-gray-500'>
        R
      </Link>
      <div className='flex items-center gap-8 font-[500]'>
        <Link href='/' className='hover:text-gray-600'>
          Home
        </Link>
        <Link href='/builder' className='hover:text-gray-600'>
          Builder
        </Link>
        <div className='w-[40px] h-[40px] flex items-center justify-center font-bold text-[24px] rounded-full   bg-gray-200'>
          <FaUser />
        </div>
      </div>
    </nav>
  );
}

export default Navbar