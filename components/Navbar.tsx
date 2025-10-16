'use client';
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import UniversalImage from './UI/UniversalImage';
import { FaDashcube, FaUser } from 'react-icons/fa6';
import { useAuth } from '@/context/authContext';
import { LogIn, LogOut } from 'lucide-react';
import { usePathname } from 'next/navigation';
// import { useTheme } from '@/context/themeContext';

const Navbar = () => {
  const [menu, setMenu] = useState<boolean>(false);
  const { user, logOut } = useAuth();
  const menuRef = useRef<HTMLDivElement | null>(null); // wrapper that contains trigger + dropdown
  const route = usePathname()
  const [activeTab, setActivetab] = useState<string>('')
  // const { theme, handleThemeChange } = useTheme();
  // console.log(theme);
  useEffect(() => {
    setActivetab(route)
    setMenu(false)

  }, [route])


  useEffect(() => {
    if (!menu) return; // only attach listeners when open
    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current) return;
      const target = event.target as HTMLElement;
      if (!menuRef.current.contains(target)) {
        setMenu(false);
      }
    };
    const handleScroll = () => setMenu(false);
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('scroll', handleScroll);
    };
  }, [menu]);

  const userImage = user?.image
  return (
    <nav className='w-full grid place-items-center fixed top-0 mt-0 transition-all ease-in-out shadow bg-white z-[99]'>
      <div className='min-[800px]:w-[800px] w-full p-2 px-2  flex items-center justify-between'>
        <Link href='/' className='w-[40px] h-[40px] flex items-center justify-center rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500'>
          <UniversalImage
            src="/icon.svg"
            alt="AI Resume Builder"
            width={32}
            height={32}
            className='rounded-md'
          />
        </Link>
        <div className='flex items-center gap-8 font-[500]'>
          <Link href='/' className={`hover:text-gray-600 ${activeTab === '/' ? 'font-bold ' : ''}`}>
            Home
          </Link>
          <Link href='/builder' className={`hover:text-gray-600 ${activeTab.includes('builder') ? 'font-bold ' : ''}`}>
            Builder
          </Link>
          {/* <div className='flex items-center justify-between text-sm rounded-full bg-gray-800 relative p-[4px] gap-1' onClick={handleThemeChange}>
            <div className={`absolute z-[10] w-6 h-6 bg-white rounded-full ${theme.isDark ? 'right-[4px]' : ''} transition-all ease-in-out duration-300`}></div>
            <Sun className={`w-4 h-4 m-1  ${theme.isDark ? 'opacity-0' : ''} transition-all ease-in-out duration-300 relative z-50`} />
            <Moon className={`w-4 h-4 m-1  ${theme.isDark ? '' : 'opacity-0'} transition-all ease-in-out duration-300 relative z-50`} />
          </div> */}
          <div ref={menuRef} className='min-w-[40px] h-[40px] relative transition-all ease-in-out duration-500 flex items-center justify-center font-bold text-[24px] rounded-full  bg-gray-200 '>
            <button
              type='button'
              aria-haspopup='menu'
              aria-expanded={menu}
              aria-label='User menu'
              onClick={() => setMenu(prev => !prev)}
              className='w-full h-full flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded-full'
            >

              {user ? <UniversalImage src={`${userImage}`} className='w-full h-full rounded-full object-cover' alt="user_profile_picture" width={32} height={32} /> : <FaUser className='p-1' />}
            </button>
            {menu && (
              <div className='min-w-fit grid absolute top-[calc(100%+12px)] z-[100] py-1 bg-gray-300 rounded right-0 text-sm font-normal divide-y divide-gray-800/50 shadow-lg border border-gray-400/30 animate-fade-in overflow-hidden' role='menu'>
                <li className='min-w-[150px] flex items-center justify content-between gap-2 p-2 '>
                  <div className='bg-blue-300 w-6 h-6 rounded-full inline-block '></div>
                  {user ? (
                    <div className='grid gap-1 '>
                      <span>{user.name}</span>
                      <span className='px-4 text-[12px] leading-4  w-fit rounded-full border-dashed border-[1px] '>member</span>
                    </div>
                  ) : (
                    <div className='grid gap-1 '>
                        <span>Guest User</span>
                      <span className='px-4 text-[12px] leading-4 w-fit rounded-full border-dashed border-[1px] '>Free</span>
                    </div>
                  )}
                </li>
                {user && (
                  <>
                    <Link href={'/builder'} className='flex items-center justify content-between gap-2 p-1'>
                      <FaDashcube /> Dashboard
                    </Link>
                  </>
                )}
                <li className='flex items-center justify content-between gap-2 p-1 cursor-pointer hover:bg-gray-200/70 transition-colors'
                  role='menuitem'
                  onClick={() => {
                    if (user) logOut(); else window.location.href = '/auth/signin';
                    setMenu(false);
                  }}>
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
