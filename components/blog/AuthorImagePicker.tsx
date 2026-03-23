import React, { useRef, useState } from 'react'
import { useAuth } from '@/context/authContext'

interface Props {
  authorImageUrl?: string
  userImage?: string | null
  uploading?: boolean
  onUpload: (file: File) => Promise<{ imageId?: string; id?: string; url?: string; blogId?: string }>
}

export default function AuthorImagePicker({ authorImageUrl, userImage, uploading, onUpload }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [localUploading, setLocalUploading] = useState(false)
  const { user } = useAuth()

  const displayUrl = authorImageUrl || userImage || user?.image

  return (
    <div className="flex items-center gap-3">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click()
        }}
        className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center cursor-pointer relative"
        aria-label="Change author image"
      >
        {displayUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={displayUrl} alt="author" className="w-full h-full object-cover" />
        ) : (
          <span className="text-sm text-gray-600">No image</span>
        )}

        {(uploading || localUploading) && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <span className="text-white text-xs">Uploading…</span>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0]
          if (!file) return
          const inputEl = e.currentTarget
          try {
            setLocalUploading(true)
            await onUpload(file)
          } finally {
            setLocalUploading(false)
            try {
              if (inputEl) inputEl.value = ''
            } catch {
              // ignore
            }
          }
        }}
      />
    </div>
  )
}
