import { FileText, Eye, Download, TrendingUp } from 'lucide-react'

export const StatsCard = ({ title, value, icon: Icon, trend }: { title: string, value: string | number, icon: any, trend?: string }) => (
    <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
        <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-teal-50 dark:bg-teal-900/20 rounded-lg text-teal-500">
                <Icon size={20} />
            </div>
            {trend && <span className="text-xs font-medium text-green-500 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full">{trend}</span>}
        </div>
        <div>
            <h4 className="text-gray-500 dark:text-slate-400 text-sm font-medium mb-1">{title}</h4>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{value}</span>
        </div>
    </div>
)

const StatsRow = ({ resumeCount }: { resumeCount: number }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatsCard title="Total Resumes" value={resumeCount} icon={FileText} trend="+1 this week" />
            <StatsCard title="Total Views" value="0" icon={Eye} />
            <StatsCard title="Downloads" value="0" icon={Download} />
            <StatsCard title="Job Match Rate" value="~" icon={TrendingUp} />
        </div>
    )
}

export default StatsRow
