'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Input from '@/components/Input';
import Button from '@/components/Ui/Button';
import { useToast } from '@/context/PopupContext';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const toast = useToast();

  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Send Verification Code
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.showToast('Please enter your email', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/auth/password-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 'send-code',
          email
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send code');
      }

      toast.showToast('Verification code sent!', 'success');
      setStep('reset');
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      toast.showToast((error as any).message || 'Something went wrong', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Perform Reset
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.showToast('Passwords do not match', 'error');
      return;
    }
    if (newPassword.length < 8) {
      toast.showToast('Password must be at least 8 characters', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 'reset',
          email,
          code,
          newPassword
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      toast.showToast('Password reset successfully! Redirecting...', 'success');
      setTimeout(() => {
        router.push('/auth/signin');
      }, 2000);

    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      toast.showToast((error as any).message || 'Failed to reset password', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[80vh] flex flex-col">
   
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-xl shadow-xl p-8 border border-slate-200 dark:border-slate-700">
          
          <div className="mb-6">
            <Link 
              href="/auth/signin" 
              className="inline-flex items-center text-sm text-slate-500 hover:text-teal-600 dark:text-slate-400 dark:hover:text-teal-400 transition-colors mb-4"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back to Sign In
            </Link>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {step === 'email' ? 'Forgot Password?' : 'Reset Password'}
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2 text-sm">
              {step === 'email' 
                ? "Enter your email address and we'll send you a verification code."
                : `Enter the code sent to ${email} and your new password.`}
            </p>
          </div>

          {step === 'email' ? (
            <form onSubmit={handleSendCode} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
              <Button
                variant="primary"
                size="large"
                fullWidth
                disabled={loading}
                type="submit"
              >
                {loading ? 'Sending Code...' : 'Send Reset Code'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
                <div className='bg-yellow-50 dark:bg-yellow-900/10 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800 text-xs text-yellow-800 dark:text-yellow-200'>
                    Check your spam folder if you do not see the email.
                </div>
              <Input
                label="Verification Code"
                placeholder="6-digit code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                disabled={loading}
              />
              <Input
                label="New Password"
                type="password"
                placeholder="Min 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={loading}
              />
              <Input
                label="Confirm Password"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
              />
              <div className="flex gap-3 pt-2">
                 <Button
                    variant="ghost"
                    size="medium"
                    fullWidth
                    onClick={() => setStep('email')}
                    disabled={loading}
                    type="button"
                >
                    Change Email
                </Button>
                <Button
                    variant="primary"
                    size="medium"
                    fullWidth
                    disabled={loading}
                    type="submit"
                >
                    {loading ? 'Resetting...' : 'Reset Password'}
                </Button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
