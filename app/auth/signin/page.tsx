'use client'
import Input from '@/components/Input';
import Button from '@/components/UI/Button';
import { useAuth } from '@/context/authContext';
import { useToast } from '@/context/PopupContext';
import React, { useState } from 'react';

const page:React.FC = () => {
  const [form, setForm] = useState<{
    username: string;
    password: string;
  }>({ username: '', password: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const {login} = useAuth()
  const toast = useToast()
  const handleSubmit =(e:React.FormEvent)=>{
    e.preventDefault()
    if(!form.username || !form.password){
        return toast.showToast('missing data', 'info', 3000);
    }
    login(form.username, form.password)

  }
  return (
    <div className='w-full md:min-h-[800px] flex flex-col items-center justify-center '>
      <h2 className='text-xl'>Welcome back! Please sign in.</h2>
      <form onSubmit={handleSubmit} className='grid gap-2  md:w-[300px] w-full p-4 shadow-lg'>
        <Input type={'text'} name={'username'} onChange={handleChange} placeholder={'Username'} />
        <Input type={'password'} name={'password'} onChange={handleChange} placeholder={'password'} />
        <Button variant='primary' size='medium' className='w-full text-center' >Sign in </Button>
      </form>
    </div>
  );
};

export default page;
