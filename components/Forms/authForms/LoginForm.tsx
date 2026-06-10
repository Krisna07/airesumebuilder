'use client';
import Button from '@/components/Ui/Button';
import { UserAuthLoading } from '@/components/Ui/LoadingScreen';
import { useAuth } from '@/context/authContext'; import { useToast } from '@/context/PopupContext';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import React, { useState } from 'react';
import { FaGoogle } from 'react-icons/fa6';

const LoginForm: React.FC = () => {
    const [form, setForm] = useState<{
        email: string;
        password: string;
    }>({ email: '', password: '' });
    const toast = useToast()
    const searchParams = useSearchParams()
    const nextTarget = (() => {
        const next = searchParams?.get('next')
        return next && next.startsWith('/') ? next : '/builder'
    })()
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
            setLoader(false)
            // Check if it's a deleted account
            if (response?.error?.includes('ACCOUNT_DELETED')) {
                return toast.showToast("Account deleted. You have 15 days to restore it. Contact support or sign in with Google to restore.", 'error', 5000)
            }
            return toast.showToast(response?.error ? response.error : "Error logging in please try again !!", 'error', 3000)
        }
        toast.showToast("Login successfull", 'success', 3000)
        setLoader(false)
        window.location.href = nextTarget
    };

    const triggerSignIn = async (provider: string) => {
        setLoader(true)
        try {
            if (provider === 'google') {
                await signIn(provider, { callbackUrl: nextTarget })
                return
            }

            const response = await signIn(provider, { redirect: false, callbackUrl: nextTarget })

            // Check if it's an existing account with password
            if (response?.error?.includes('EXISTING_ACCOUNT_WITH_PASSWORD')) {
                setLoader(false)
                return toast.showToast(
                    "You already have an account with email/password. Please sign in using your email and password instead.",
                    'warning',
                    5000
                )
            }

            if (response?.error) {
                setLoader(false)
                toast.showToast(response.error, 'error', 3000)
            } else if (response?.ok) {
                // Successfully signed in, redirect
                window.location.href = nextTarget
            } else {
                setLoader(false)
            }
        } catch (error) {
            // console.log(error)
            setLoader(false)
            toast.showToast("Sign in failed, please try again", 'error', 3000)
        }
    }
    return (
        <div className=' overflow-hidden w-full max-w-[600px] p-6 flex flex-col items-center justify-center shadow-[0_0_2px_0px_gray] rounded-2xl '>
            {loader && <div className='w-screen h-screen fixed top-0 z-1000 backdrop-blur-3xl  flex items-center justify-center'>
                <UserAuthLoading />
            </div>}
            <h2 className='text-[2rem] font-bold'>Welcome back</h2>
            <p>
                New to resume builder ?{' '}
                <Link href='/auth/newuser' className='underline text-blue-600'>
                    Join now
                </Link>{' '}
            </p>
            <form onSubmit={handleSubmit} className='w-full max-w-[600px] grid gap-4 p-4 font-semibold '>
                <div className='grid gap-2'>
                    <label className=''>Email Address</label>
                    <input type='email' name='email' value={form.email} onChange={handleChange} className='font-normal p-2  outline-none ring-1 focus:ring-green-600 ring-gray-400 rounded-md' />
                </div>
                <div className='grid gap-2'>
                    <label className=''>Password</label>
                    <input type='password' name='password' value={form.password} onChange={handleChange} className='  p-2  outline-none ring-1 focus:ring-green-600 ring-gray-400  rounded-md' />
                    <div className="flex justify-end">
                        <Link href="/auth/forgot-password" className="text-sm text-teal-600 hover:underline">Forgot password?</Link>
                    </div>
                </div>

                <Button variant='primary' size='large' className='w-full flex items-center justify-center rounded-full mt-4 pt-2 pb-2' disabled={loading ? true : false}>
                    {loader ? 'signing in ....' : '  Sign in'}
                </Button>
                <div className='w-full flex sm:flex-col items-center justify-between space-y-1 gap-4'>
                    <Button type='button' variant='secondary' size='medium' onClick={() => triggerSignIn('google')} className='w-full'>
                        <FaGoogle /> Sign in with Google
                    </Button>
                </div>
            </form>

        </div>
    );
};

export default LoginForm;
