'use client';
import Button from '@/components/UI/Button';
import { useAuth } from '@/context/authContext';
import { useToast } from '@/context/PopupContext';
import React, { useState } from 'react';

const Page: React.FC = () => {
  const [form, setForm] = useState<{
    username: string;
    password: string;
  }>({ username: '', password: '' });

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const { login, loading } = useAuth();
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username || !form.password) {
      return toast.showToast('missing data', 'info', 3000);
    }
    const response: { status: number; message: string } = await login(form.username, form.password);
    if (response?.status !== 200) {
      return toast.showToast(response?.message, 'error', 2000);
    }
    toast.showToast(response.message, 'success', 3000);
    return (window.location.href = '/builder');
  };

  return (
    <div className='w-full p-6 flex flex-col items-center justify-center shadow-[0_0_2px_0px_gray] rounded-2xl '>
      <h2 className='text-6xl font-bold'>Welcome back</h2>
      <p>
        New to resume builder ?{' '}
        <a href='/auth/newuser' className='underline text-blue-600'>
          Join now
        </a>{' '}
      </p>
      <form onSubmit={handleSubmit} className='w-full lg:w-[600px] grid gap-4  md:w-[300px]  p-4 font-semibold '>
        <div className='grid gap-2'>
          <label className=''>Email Address or Username</label>
          <input type='text' name='username' value={form.username} onChange={handleChange} className=' font-normal p-2 text-black outline-none ring-1 focus:ring-green-600 ring-gray-400  rounded-md' />
        </div>
        <div className='grid gap-2'>
          <label className=''>Password</label>
          <input type='password' name='password' value={form.password} onChange={handleChange} className='  p-2 text-black outline-none ring-1 focus:ring-green-600 ring-gray-400  rounded-md' />
        </div>

        <Button variant='primary' size='large' className='w-full flex items-center justify-center rounded-full mt-4 pt-2 pb-2' disabled={loading ? true : false}>
          {loading ? 'signing in ....' : '  Sign in'}
        </Button>
      </form>
    </div>
  );
};

export default Page;
