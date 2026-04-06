'use client';
import Button from '@/components/Ui/Button';
import { UserAuthLoading } from '@/components/Ui/LoadingScreen';
import { useAuth } from '@/context/authContext';
import { useToast } from '@/context/PopupContext';
import Link from 'next/link';
import React, { useState } from 'react';
import { FaCircleExclamation, FaGithub, FaGoogle } from 'react-icons/fa6';

const SignUpForm: React.FC = () => {
    const [form, setForm] = useState<{
        email: string;
        password: string;
    }>({ password: '', email: '' });
    const { register, loading, user, signIn } = useAuth();
    const [loader, setLoader] = useState(false)
    const [isError, setIsError] = useState(false)


    const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        setIsError(false)
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const { showToast } = useToast()

    const handleSubmit = async (e: React.FormEvent) => {
        setLoader(true)
        e.preventDefault();
        const registerData = {
            email: form.email,
            provider: 'credentials',
            password: form.password,
        };
        try {
            if (!form.email || !form.password) {
                setIsError(true)
                showToast('Please complete mandatory fields', 'error', 3000)
                return
            }

            await register(registerData);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            setLoader(false)
            showToast('Error has occured while creating your account', 'error', 3000)
            throw new Error(err)
        } finally {
            setLoader(false)

        }

    };

    if (user) {
        setLoader(false)
        return (window.location.href = '/builder');
    }
    return (
        <div className='overflow-hidden w-full max-w-[600px] p-6 flex flex-col items-center justify-center shadow-[0_0_2px_0px_gray] rounded-2xl '>
            {loader && <div className='w-screen h-screen fixed top-0 z-1000 backdrop-blur-3xl  flex items-center justify-center'>
                <UserAuthLoading />
            </div>}

<<<<<<< HEAD
            <h2 className='text-2xl font-bold text-center'>Welcome to Resume Craft</h2>

            <form onSubmit={handleSubmit} className='w-full  grid gap-4   p-4 font-semibold '>
                <div className='grid gap-2 relative'>
                    <label className=''>Email *</label>
                    <input type='email' name='email' value={form.email} onChange={handleChange} className={`font-normal p-2  outline-none ring-1 focus:ring-green-600 ${isError ? 'ring-red-500' : 'ring-gray-400'} transition-all ease-in-out   rounded-md`} />
                    <FaCircleExclamation className={` absolute bottom-3 right-2 ${isError ? 'opacity-100 text-red-500' : 'opacity-0 bg-none'} transition-all ease-in-out `} />
=======
            <h2 className='text-[2rem] font-bold text-center'>Welcome to Resume Craft</h2>
            <p>
                Already have an account?{' '}
                <Link href='/auth/signin' className='underline text-blue-600'>
                    Log in here
                </Link>
            </p>
            <form onSubmit={handleSubmit} className='w-full max-w-[600px] grid gap-4 p-4 font-semibold '>
                <div className='grid gap-2'>
                    <label className=''>Email Address</label>
                    <input type='email' name='email' value={form.email} onChange={handleChange} className={`font-normal p-2 outline-none ring-1 focus:ring-green-600 ${isError ? 'ring-red-500' : 'ring-gray-400'} transition-all ease-in-out rounded-md`} />
>>>>>>> 529b3bb (feat: update layout metadata, enhance hero section, and improve how it works component; add robots.txt for SEO)
                </div>
                <div className='grid gap-2'>
                    <label className=''>Password</label>
                    <input type='password' name='password' value={form.password} onChange={handleChange} className={`p-2 outline-none ring-1 focus:ring-green-600 ${isError ? 'ring-red-500' : 'ring-gray-400'} transition-all ease-in-out rounded-md`} />
                </div>
<<<<<<< HEAD
                <p className='w-[80%]'>
                    Already have an account?{' '}
                    <a href='/auth/signin' className='underline text-blue-600'>
                        Log in here
                    </a>
                    .
                </p>
                <label className='flex hidden items-start gap-2'>
                    <input type='checkbox' />
                    <p className=' text-gray-500 leading-[120%] '>
                        By checking the box on right,
                        You confirm you agree to our{' '}
                        <a href='/terms' className='underline text-blue-600'>
                            Terms of Service
                        </a>{' '}
                        and{' '}
                        <a href='/privacy' className='underline text-blue-600'>
                            Privacy Policy
                        </a>
                        .
                    </p>
                </label>
=======
>>>>>>> 529b3bb (feat: update layout metadata, enhance hero section, and improve how it works component; add robots.txt for SEO)

                <Button variant='primary' size='large' className='w-full flex items-center justify-center rounded-full mt-4 pt-2 pb-2' disabled={loading ? true : false}>
                    {loader ? 'Creating account....' : '  Create Account'}
                </Button>
                <div className='w-full  sm:flex-col items-center justify-between space-y-1 gap-4 hidden '>
                    <Button variant='secondary' size='medium' onClick={() => signIn('google')} className='w-full'>
                        <FaGoogle /> Sign in with Google
                    </Button>

                    <Button variant='primary' size='medium' onClick={() => signIn('github')} className='w-full'>
                        <FaGithub /> Sign in with GitHub
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default SignUpForm;
