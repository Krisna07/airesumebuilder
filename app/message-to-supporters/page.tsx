"use client"

import React, { useEffect, useState } from 'react'
import bg from './scrollBackground.png'
import { Megaphone } from 'lucide-react';

const message = `Dear Supporter,\n\nThank you for believing in AI Resume Craft. Your support keeps this small project alive and helps us build features that make job hunting kinder and more effective. Every suggestion, shared story, and contribution—no matter how small—powers our team and improves the product for everyone.\n\nWe are working on more features to make applying and sharing your work easier. One upcoming feature is \"resumeLink\": a secure, shareable resume URL you can send directly to recruiters so they can view or download your resume without asking for attachments.\n\nIf you'd like to support our work directly, consider buying us a coffee: https://buymeacoffee.com/krisnachhe0(thank you!).\n\nWith deep gratitude and warm wishes,\nThe AI Resume Craft Team`

function Typewriter({ text, speed = 60, initialDelay = 300 }: { text: string; speed?: number; initialDelay?: number }) {
    const [display, setDisplay] = useState('')
    const [done, setDone] = useState(false)
    useEffect(() => {
        let mounted = true
        const start = () => {
            let i = 0
            const tick = () => {
                if (!mounted) return
                i += 1
                setDisplay(text.slice(0, i))
                if (i < text.length) {
                    const jitter = Math.random() * (speed * 0.4)
                    setTimeout(tick, speed + jitter)
                } else {
                    setDone(true)
                }
            }
            tick()
        }
        const timer = setTimeout(start, initialDelay)
        return () => {
            mounted = false
            clearTimeout(timer)
        }
    }, [text, speed, initialDelay])

    return (
        <div style={{ whiteSpace: 'pre-wrap' }} aria-live="polite">
            <span>{display}</span>
            {!done && (
                <span className="inline-block ml-1" style={{ width: 10 }}>
                    <span style={{ display: 'inline-block', width: 8, height: 18, background: '#2b2b2b', animation: 'blink 1s steps(2,start) infinite' }} />
                </span>
            )}
            <style>{`@keyframes blink { 0% { opacity:1 } 50% { opacity:0 } 100% { opacity:1 } }`}</style>
        </div>
    )
}

export default function Page() {
    return (
        <section className="min-h-screen flex items-center justify-center" style={{ minHeight: '100vh' }}>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Mea+Culpa&display=swap');`}</style>
            <div className="w-full px-6 sm:px-8 lg:px-12">
                <div className="max-w-4xl mx-auto">
                    <div className='min-h-[60vh] sm:h-[86vh] flex items-center justify-center'>
                        <div className='w-full h-full flex items-start justify-center' >
                            <div className='w-11/12 max-w-[640px] p-4 sm:p-6 md:p-8' style={{ maxHeight: '74vh', overflowY: 'auto' }}>
                                <div style={{ fontSize: '16px', lineHeight: 1.9, padding: '20px', borderRadius: 6 }}>
                                    <Typewriter text={message} speed={56} initialDelay={200} />
                                </div>

                            </div>
                        </div>
                    </div>

                    <div className="mt-8 p-6 rounded-lg border bg-transparent  cursor-pointer grid gap-2 mb-4" style={{ maxWidth: '900px' }}>
                        <h2 className="text-xl font-semibold flex items-center gap-2  mb-2"><Megaphone color='red' /> Upcoming feature</h2>
                        <div className='grid gap-1 leading-3'>
                            <h3 className='leading-1 font-semibold'>Resume-Link</h3>
                            <p className="mt-2 text-xs">Soon you'll be able to create a secure, shareable link to your resume directly from the app. Share it with recruiters, include it in applications, or paste it into messages — no attachments required.</p>

                        </div>

                    </div>
                </div>
            </div>
        </section>
    )
}
