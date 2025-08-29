'use client';
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { FaDashcube, FaUser } from 'react-icons/fa6';
import { useAuth } from '@/context/authContext';
import { LogIn, LogOut } from 'lucide-react';
// import { useTheme } from '@/context/themeContext';

const Navbar = () => {
  const [menu, setMenu] = useState<boolean>(false);
  const { user, logout } = useAuth();
  const menuRef = useRef(null);
  // const { theme, handleThemeChange } = useTheme();
  // console.log(theme);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      console.log(menu);
      if (menuRef.current && !(menuRef.current as HTMLElement).contains((event.target as HTMLElement)?.parentElement)) {
        setMenu(false);
      }
    };

    const handleScroll = () => {
      setMenu(false);
    };

    if (menu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('scroll', handleScroll);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('scroll', handleScroll);
    };
  }, [menu]);

  return (
    <nav className='w-full grid place-items-center sticky top-0 my-1 transition-all ease-in-out shadow bg-white'>
      <div className='min-[800px]:w-[800px] w-full p-2 px-2  flex items-center justify-between'>
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
          {/* <div className='flex items-center justify-between text-sm rounded-full bg-gray-800 relative p-[4px] gap-1' onClick={handleThemeChange}>
            <div className={`absolute z-[10] w-6 h-6 bg-white rounded-full ${theme.isDark ? 'right-[4px]' : ''} transition-all ease-in-out duration-300`}></div>
            <Sun className={`w-4 h-4 m-1  ${theme.isDark ? 'opacity-0' : ''} transition-all ease-in-out duration-300 relative z-50`} />
            <Moon className={`w-4 h-4 m-1  ${theme.isDark ? '' : 'opacity-0'} transition-all ease-in-out duration-300 relative z-50`} />
          </div> */}
          <div className='min-w-[40px] h-[40px] relative  transition-all ease-in-out duration-500 flex items-center justify-center font-bold text-[24px] rounded-full px-2 bg-gray-200'>
            <FaUser onClick={() => setMenu(!menu)} />
            {menu && (
              <div ref={menuRef} className='min-w-fit grid absolute top-[calc(100%+12px)] z-[100] py-1 bg-gray-300 rounded right-0 text-sm font-normal divide-y divide-gray-800/50 '>
                <li className='min-w-[150px] flex items-center justify content-between gap-2 p-2 '>
                  <div className='bg-blue-300 w-6 h-6 rounded-full inline-block '></div>
                  {user ? (
                    <div className='grid gap-1 '>
                      <span>{user.name || user.email.split('@')[0]}</span>
                      <span className='px-4 text-[12px] leading-4  w-fit rounded-full border-dashed border-[1px] '>member</span>
                    </div>
                  ) : (
                    <div className='grid gap-1 '>
                      <span>Unknown User</span>
                      <span className='px-4 text-[12px] leading-4 w-fit rounded-full border-dashed border-[1px] '>Free</span>
                    </div>
                  )}
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
      </div>
    </nav>
  );
};

export default Navbar;
