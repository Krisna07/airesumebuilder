'use client';
import Button from '@/components/UI/Button';
import { useAuth } from '@/context/authContext';
import React, { useState } from 'react';
import { FaGithub, FaGoogle } from 'react-icons/fa6';

const SignUpForm: React.FC = () => {
    const [form, setForm] = useState<{
        // username: string;
        email: string;
        password: string;
    }>({  password: '', email: '' });
    const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };
    const { register, loading, user, signIn } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        register(
            {
                email: form.email,
                password: form.password,
                // name: form.username
            }
        );
    };

    if (user) {
        return (window.location.href = '/builder');
    }
    return (
      <div className='w-full h-full grid place-items-center'>  
            <div className='min-[600px]:w-[600px] w-full p-6 flex flex-col items-center justify-center shadow-[0_0_2px_0px_gray] rounded-2xl '>
            <h2 className='text-6xl font-bold'>Welcome</h2>
            <p>
                Already have an account?{' '}
                <a href='/auth/signin' className='underline text-blue-600'>
                    Login here{' '}
                </a>{' '}
            </p>
            <form onSubmit={handleSubmit} className='w-full  grid gap-4   p-4 font-semibold '>
                <div className='grid gap-2'>
                    <label className=''>Email *</label>
                    <input type='email' name='email' value={form.email} onChange={handleChange} className=' font-normal p-2 text-black outline-none ring-1 focus:ring-green-600 ring-gray-400  rounded-md' />
                </div>
                {/* <div className='grid gap-2'>
                    <label className=''>Username </label>
                    <input type='text' name='username' value={form.username} onChange={handleChange} className=' font-normal p-2 text-black outline-none ring-1 focus:ring-green-600 ring-gray-400  rounded-md' />
                </div> */}

                <div className='grid gap-2'>
                    <label className=''>Password *</label>
                    <input type='password' name='password' value={form.password} onChange={handleChange} className='  p-2 text-black outline-none ring-1 focus:ring-green-600 ring-gray-400  rounded-md' />
                </div>

                <Button variant='primary' size='large' className='w-full flex items-center justify-center rounded-full mt-4 pt-2 pb-2' disabled={loading ? true : false}>
                    {loading ? 'Creating account....' : '  Create Account'}
                </Button>
                <div className='w-full flex max-[600px]:flex-col items-center justify-between gap-4'>
                    <Button variant='secondary' size='medium' onClick={() => signIn('google')} className='w-full'>
                        <FaGoogle /> Sign in with Google
                    </Button>
                    <Button variant='primary' size='medium' onClick={() => signIn('github')} className='w-full'>
                        <FaGithub /> Sign in with GitHub
                    </Button>
                </div>
            </form>
        </div></div>
    );
};

export default SignUpForm;
