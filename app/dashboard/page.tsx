'use client'

import ResumeList from '@/components/ResumeList'
import { FaRobot } from 'react-icons/fa6'


export default function DashboardPage() {
  return (
    <div className="grid gap-4 mx-4 ">
      <div className='text-sm bg-gradient-to-r from-blue-500/20 via-purple-500/30 to-orange-600/20 animate-gradient-shift w-fit pr-4 px-2 rounded-full flex items-center gap-2 font-semibold text-gray-800'>
        <div className='min-w-[8px] min-h-[8px] bg-green-500 animate-pulse rounded-full'></div>
        Create Your Personalise Resume with AI
        <FaRobot/>
        </div> 
      <main>
        <ResumeList />
      </main>
    </div>
  )
}
