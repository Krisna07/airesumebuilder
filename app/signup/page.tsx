"use client";
import React, { useState } from "react";
import { useAuth } from "@/context/authContext";

export default function SignupPage() {
  const { register, loading, user } = useAuth();
  console.log(user);
  const [form, setForm] = useState({ email: '', password: '', name: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await register(form.email, form.password, form.name);
      setSuccess('Account created! You can now log in.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    }
  };

  if (user) {
    return (window.location.href = '/builder');
  }

  return (
    <div className='max-w-md mx-auto mt-10 p-6 bg-white rounded shadow'>
      <h2 className='text-2xl font-bold mb-4'>Sign Up</h2>
      <form onSubmit={handleSubmit} className='space-y-4'>
        <input type='text' name='name' placeholder='Name' value={form.name} onChange={handleChange} className='w-full border px-3 py-2 rounded' required />
        <input type='email' name='email' placeholder='Email' value={form.email} onChange={handleChange} className='w-full border px-3 py-2 rounded' required />
        <input type='password' name='password' placeholder='Password' value={form.password} onChange={handleChange} className='w-full border px-3 py-2 rounded' required />
        <button type='submit' className='w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700' disabled={loading}>
          {loading ? 'Signing up...' : 'Sign Up'}
        </button>
        {error && <div className='text-red-600'>{error}</div>}
        {success && <div className='text-green-600'>{success}</div>}
      </form>
    </div>
  );
}
