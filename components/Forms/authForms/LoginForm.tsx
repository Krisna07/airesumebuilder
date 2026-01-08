'use client';
import Button from '@/components/UI/Button';
import { useAuth } from '@/context/authContext'; import { useToast } from '@/context/PopupContext';
import React, { useState } from 'react';
import { FaGithub, FaGoogle } from 'react-icons/fa6';

const LoginForm: React.FC = () => {
    const [form, setForm] = useState<{
        email: string;
        password: string;
    }>({ email: '', password: '' });
    const toast = useToast()
    const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };
    const { signIn, loading } = useAuth();
    const [loader, setLoader] = useState(false)
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoader(true)
        const response = await signIn('credentials', { email: form.email, password: form.password, redirect: false });

        if (!response?.ok) {
            console.log(response)
            setLoader(false)
            return toast.showToast(`Error logging in. Please try again later.`, 'error', 3000)
        }
        toast.showToast("Login successfull", 'success', 3000)
        setLoader(false)
        window.location.href = '/builder'
    };

    const triggerSignIn = async (provider: string) => {
        setLoader(true)
        try {
            const response = await signIn(provider)
            if (response) {
                // console.log(response)
                setLoader(false)
            }
        } catch (error) {
            // console.log(error)
            setLoader(false)
            throw error
        }
    }
    return (
        <div className=' overflow-hidden min-[600px]:w-[600px] w-full p-6 flex flex-col items-center justify-center shadow-[0_0_2px_0px_gray] rounded-2xl '>
            {loader && <div className='w-screen h-screen fixed top-0 z-1000  flex items-center justify-center'>
                <div className='grid gap-4 place-items-center font-bold text-3xl text-center'>
                    <div className="loader"></div>
                    <h3 className=' animate-pulse'>Authenticating User....</h3>
                </div>
            </div>}
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
                    <input type='email' name='email' value={form.email} onChange={handleChange} className='font-normal p-2  outline-none ring-1 focus:ring-green-600 ring-gray-400 rounded-md' />
                </div>
                <div className='grid gap-2'>
                    <label className=''>Password</label>
                    <input type='password' name='password' value={form.password} onChange={handleChange} className='  p-2  outline-none ring-1 focus:ring-green-600 ring-gray-400  rounded-md' />
                </div>

                <Button variant='primary' size='large' className='w-full flex items-center justify-center rounded-full mt-4 pt-2 pb-2' disabled={loading ? true : false}>
                    {loader ? 'signing in ....' : '  Sign in'}
                </Button>
            </form>
            <div className='w-full  max-[600px]:flex-col items-center justify-between gap-4 hidden'>
                <Button variant='secondary' size='medium' onClick={() => triggerSignIn('google')} className='w-full'>
                    <FaGoogle /> Sign in with Google
                </Button>
                <Button variant='primary' size='medium' onClick={() => triggerSignIn('github')} className='w-full'>
                    <FaGithub /> Sign in with GitHub
                </Button>
            </div>
        </div>
    );
};

export default LoginForm;
