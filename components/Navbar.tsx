'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { FaDashcube, FaUser } from 'react-icons/fa6';
import { useAuth } from '@/context/authContext';
import { LogIn, LogOut } from 'lucide-react';

const Navbar = () => {
  const [menu, setMenu] = useState<boolean>(false);
  const { user, logout } = useAuth();
  console.log(user ? user : 'NOt yet loaded');
  // const handleMenu = (menu: boolean) => {
  //   setMenu(!menu);
  // };

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
        <div className='min-w-[40px] h-[40px] relative  transition-all ease-in-out duration-500 flex items-center justify-center font-bold text-[24px] rounded-full px-2 bg-gray-200'>
          <FaUser onClick={() => setMenu(!menu)} />
          {menu && (
            <div className='grid absolute top-full z-[100] p-1 px-2 bg-gray-300/50 rounded left-0 text-sm font-normal divide-amber-500 divide-y divide-dashed list-none'>
              <li className='flex items-center justify content-between gap-2 p-1'>
                <div className='bg-blue-300 w-6 h-6 rounded-full '></div> {user ? user.name : 'user1'}
              </li>
              {user && (
                <>
                  <li className='flex items-center justify content-between gap-2 p-1'>
                    <FaDashcube /> Dashboard
                  </li>
                </>
              )}
              <li className='flex items-center justify content-between gap-2 p-1' onClick={() => (user ? logout() : (window.location.href = 'auth/signin'))}>
                {user ? (
                  <>
                    <LogOut /> Sign out
                  </>
                ) : (
                  <>
                    <LogIn /> Login
                  </>
                )}
              </li>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
