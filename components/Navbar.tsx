import React from 'react'
import { FaUser } from 'react-icons/fa6'

const Navbar = () => {
  return (
    <nav className='w-full p-2 px-4 bg-gray-300 flex items-center justify-between'>
        <div className='w-[40px] h-[40px] flex items-center justify-center font-bold text-[32px] rounded-full mask-radial-from-neutral-500  bg-gray-500'>R</div>
        <div className='flex items-center gap-8 font-[500]'>
            <span className='hover:text-gray-600'>Home</span>
            <span className='hover:text-gray-600'>Builder</span>
            {/* <span>All Resume</span> */}
        <div className='w-[40px] h-[40px] flex items-center justify-center font-bold text-[24px] rounded-full   bg-gray-200'><FaUser/></div>

        </div>

    </nav>
  )
}

export default Navbar