'use client';
import Button from '@/components/UI/Button';
import { useAuth } from '@/context/authContext';
import React, { useState } from 'react';

const Page: React.FC = () => {
  const [form, setForm] = useState<{
    email: string;
    password: string;
  }>({ email: '', password: '' });

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const { signIn, loading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await signIn('credentials', { email: form.email, password: form.password });
  };

  return (
    <div className='w-full p-6 flex flex-col items-center justify-center shadow-[0_0_2px_0px_gray] rounded-2xl '>
      <h2 className='text-[2rem] font-bold'>Welcome back</h2>
      <p>
        New to resume builder ?{' '}
        <a href='/auth/newuser' className='underline text-blue-600'>
          Join now
        </a>{' '}
      </p>
      <form onSubmit={handleSubmit} className='w-full lg:w-[600px] grid gap-4    p-4 font-semibold '>
        <div className='grid gap-2'>
          <label className=''>Email Address</label>
          <input type='email' name='email' value={form.email} onChange={handleChange} className='font-normal p-2 text-black outline-none ring-1 focus:ring-green-600 ring-gray-400 rounded-md' />
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
