'use client';
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import UniversalImage from './UI/UniversalImage';
import { FaDashcube, FaUser } from 'react-icons/fa6';
import { useAuth } from '@/context/authContext';
import { LogIn, LogOut, Moon, Sun } from 'lucide-react';
import { usePathname } from 'next/navigation';

const Navbar = () => {
  const [menu, setMenu] = useState<boolean>(false);
  const { user, logOut } = useAuth();
  const menuRef = useRef<HTMLDivElement | null>(null); // wrapper that contains trigger + dropdown
  const route = usePathname()
  const [activeTab, setActivetab] = useState<string>('')
  const [isDark, setIsDark] = useState(false);


  useEffect(() => {
    setActivetab(route??"")
    setMenu(false)

  }, [route])

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  console.log(isDark)
  const toggleTheme = () => {
    if (typeof window === 'undefined') return;

    setIsDark(prev => {
      const next = !prev;
      const root = document.documentElement;
      root.classList.toggle('dark', next);

      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (next === prefersDark) {
        localStorage.removeItem('theme');
      } else {
        localStorage.setItem('theme', next ? 'dark' : 'light');
      }

      return next;
    });
  };

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
    <nav className='w-full grid place-items-center sticky top-0 mt-0 transition-all ease-in-out shadow  dark:text-white  dark:bg-gray-800 z-99'>
      <div className='min-[800px]:w-[800px] w-full p-2 px-2  flex items-center justify-between'>
        <Link href='/' className='w-10 h-10 flex items-center justify-center rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500'>
          <UniversalImage
            src="/icon.svg"
            alt="AI Resume Builder"
            width={32}
            height={32}
            className='rounded-md'
          />
        </Link>
        <div className='flex items-center gap-8 font-medium'>
          <Link href='/' className={`hover:text-gray-600 ${activeTab === '/' ? 'font-bold ' : ''}`}>
            Home
          </Link>
          <Link href='/builder' className={`hover:text-gray-600 ${activeTab.includes('builder') ? 'font-bold ' : ''}`}>
            Builder
          </Link>
          <button
            type='button'
            aria-pressed={isDark}
            onClick={toggleTheme}
            className='flex items-center justify-between text-sm rounded-full bg-gray-200 dark:bg-gray-700 relative p-1 gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500'
          >
            <Sun className={`w-4 h-4 relative z-20 m-1 transition-opacity duration-300  text-white   ${isDark ? 'opacity-0 ' : 'opacity-100 '}`} />
            <Moon className={`w-4 h-4 relative z-20 m-1 transition-opacity duration-300  text-black ${isDark ? 'opacity-100 ' : 'opacity-0'}`} />
            <div className={`absolute inset-y-1 z-10 w-6 rounded-full bg- dark:bg-white bg-black  transition-transform duration-300 ${isDark ? 'translate-x-7' : 'translate-x-0'}`} />

          </button>
          <div ref={menuRef} className='w-10 h-10 relative transition-all ease-in-out duration-500 flex items-center justify-center font-bold text-[24px] rounded-full  bg-gray-200 '>
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
              <div className='min-w-fit grid absolute top-[calc(100%+12px)] z-100 py-1 bg-gray-300 rounded right-0 text-sm font-normal divide-y divide-gray-800/50 shadow-lg border border-gray-400/30 animate-fade-in overflow-hidden' role='menu'>
                <li className='min-w-[150px] flex items-center justify content-between gap-2 p-2 '>
                  <div className='bg-blue-300 w-6 h-6 rounded-full inline-block '></div>
                  {user ? (
                    <div className='grid gap-1 '>
                      <span>{user.name}</span>
                      <span className='px-4 text-[12px] leading-4  w-fit rounded-full border-dashed border '>member</span>
                    </div>
                  ) : (
                    <div className='grid gap-1 '>
                        <span>Guest User</span>
                        <span className='px-4 text-[12px] leading-4 w-fit rounded-full border-dashed border '>Free</span>
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
