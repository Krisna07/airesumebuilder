'use client';
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FaDashcube, FaUser } from 'react-icons/fa6';
import { useAuth } from '@/context/authContext';
import { LogIn, LogOut } from 'lucide-react';
import { usePathname } from 'next/navigation';
// import { useTheme } from '@/context/themeContext';

const Navbar = () => {
  const [menu, setMenu] = useState<boolean>(false);
  const { user, signOut, loading } = useAuth();
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
    <nav className='w-full grid place-items-center sticky top-0 my-1 transition-all ease-in-out shadow bg-white z-[99]'>
      <div className='min-[800px]:w-[800px] w-full p-2 px-2  flex items-center justify-between'>
        <Link href='/' className='w-[40px] h-[40px] flex items-center justify-center rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500'>
          <Image
            src="/icon.svg"
            alt="AI Resume Builder"
            width={32}
            height={32}
            priority
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

              {user ? <img src={`${userImage}`} className='w-full h-full rounded-full object-center' alt="user_profile_picture" /> :
                loading ? <div role="status">
                  <svg aria-hidden="true" className="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
                    <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
                  </svg>
                  <span className="sr-only">Loading...</span>
                </div> : <FaUser className='p-1' />}
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
                    if (user) signOut(); else window.location.href = '/auth/signin';
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
