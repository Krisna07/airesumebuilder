/* eslint-disable @typescript-eslint/no-explicit-any */
import { Edit, Plus, Trash } from "lucide-react";

export default function MenuPanel  ({ menu, setShowConfirm, slug, menuRef }: any)  {
  return (
    menu && <div onClick={(e) => e.stopPropagation()} ref={menuRef} className='shadow p-4 rounded grid gap-2'>
      <button onClick={() => (window.location.href = `/builder/${slug}`)} className=" px-4 py-1 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium shadow-md flex items-center gap-2">
        <Edit size={16} /> Edit Resume
      </button>
      <button onClick={() => (window.location.href = '/builder')} className=" px-4 py-1 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium shadow-md flex items-center gap-2">
        <Plus size={16} /> New Resume
      </button>
      <button onClick={() => setShowConfirm(true)} className={` px-4 py-1 bg-red-200 text-gray-800 rounded-lg transition-colors font-medium shadow-md flex items-center gap-2 hover:bg-red-400`}>
        <Trash size={16} /> Delete
      </button>
    </div>
  )
};