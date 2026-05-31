"use client"
import React, { useEffect, useState, useRef } from 'react'
import { useAuth } from '@/context/authContext'
import Button from './Ui/Button';

const VerificationModal: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const { verifyCode, resendVerification, user, verificationExpiresAt, getVerificationStatus } = useAuth()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)
  const [resendLoading, setResendLoading] = useState(false)
  const resendCooldownRef = useRef(false)
  
  useEffect(() => {
    if (!open || !user?.email) return

    let mounted = true
    const resolveVerificationStatus = async () => {
      const status = await getVerificationStatus(false)
      if (!mounted) return
      setExpiresAt(status.expiresAt)
    }

    void resolveVerificationStatus()
    return () => {
      mounted = false
    }
  }, [user?.email, open, getVerificationStatus])

  useEffect(() => {
    setExpiresAt(verificationExpiresAt)
  }, [verificationExpiresAt])

  useEffect(() => {
    if (!expiresAt) {
      setSecondsLeft(null)
      return
    }
    const update = () => {
      const diff = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000))
      setSecondsLeft(diff)
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [expiresAt])

  if (!open) return null

  const submit = async () => {
    if (code.trim().length !== 6) return
    setLoading(true)
    const ok = await verifyCode(code.trim())
    setLoading(false)
    if (ok) onClose()
  }

  const handleResend = async () => {
    if (resendCooldownRef.current) return
    setResendLoading(true)
    resendCooldownRef.current = true
    try {
      const res = await resendVerification()
      if (res?.expiresAt) {
        setExpiresAt(res.expiresAt)
      }
      // set a short cooldown before user can click resend again
      setTimeout(() => { resendCooldownRef.current = false }, 10 * 1000)
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="w-full h-screen fixed top-0 left-0  z-50 flex items-center justify-center bg-black/40">
      <div className="w-[420px] max-w-full bg-white dark:bg-slate-900 rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Verification Code</h3>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">Enter the 6-digit code we sent to your email to verify your account.</p>

        <div className="mt-4 flex gap-2 items-center justify-center">
          <input
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
            className="w-48 text-center text-2xl tracking-widest p-2 border rounded-md bg-slate-50 dark:bg-slate-800"
            placeholder="123456"
          />
        </div>
         <div className="w-full text-sm text-center text-slate-600 dark:text-slate-300 mt-2">
            {secondsLeft === null ? null : secondsLeft > 0 ? (
              <span>Code expires in {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}</span>
            ) : (
              <span className="text-red-500">Code expired</span>
            )}
          </div>

        <div className="w-full mt-4 flex items-center justify-center gap-2">
         
            <Button size="small" variant="danger" onClick={onClose} className="px-3 py-2 rounded-md bg-slate-100 dark:bg-slate-800">Cancel</Button>
            <Button size="small" variant="ghost"  onClick={handleResend} disabled={resendLoading} className="px-3 py-2 rounded-md 733208 border shadow text-primary-dark whitespace-nowrap">
              {resendLoading ? 'Sending...' : 'Resend code'}
            </Button>
            <Button size="small" variant="primary"  onClick={submit} disabled={loading} className="px-4 py-2 rounded-md bg-teal-600 text-white">{loading ? 'Verifying...' : 'Verify'}</Button>
       
        </div>
      </div>
    </div>
  )
}

export default VerificationModal
