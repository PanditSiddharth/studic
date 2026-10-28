'use client'

import { CldUploadButton } from 'next-cloudinary'
import { FileIcon, RefreshCw } from 'lucide-react'
import { cn } from '@/modals/utils'

interface FileUploadProps {
  onChange: (src: string) => void
  value?: string // current file URL
  className?: string
}

interface CloudinaryUploadResponse {
  info: {
    secure_url: string
    original_filename: string
  }
}

const buttonProps = { type: "button" } as const

const safeDecode = (value: string) => {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

export const FileUpload = ({ onChange, value, className }: FileUploadProps) => {
  // Derived from the stored URL so editing an existing product shows the real file
  // instead of overwriting the field on mount.
  const rawName = value ? safeDecode(value.split('/').pop()?.split('?')[0] || '') : ''
  const fileName = rawName || ''

  return (
    <CldUploadButton
      {...buttonProps}
      className={cn(
        'group block w-full overflow-hidden rounded-xl border-2 border-dashed border-border bg-muted/20 text-left transition-colors',
        'hover:border-primary/60 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className
      )}
      uploadPreset="sidssite"
      options={{ maxFiles: 1, resourceType: 'raw' }}
      onSuccess={(result: unknown) => {
        const response = result as CloudinaryUploadResponse
        if (response?.info?.secure_url) onChange(response.info.secure_url)
      }}
    >
      <span className="flex items-center gap-4 p-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <FileIcon size={22} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium">
            {fileName ? 'Attached file' : 'Attach a downloadable file'}
          </span>
          <span className="mt-0.5 block truncate text-xs text-muted-foreground">
            {fileName || 'PDF, ZIP, or any file · uploaded to Cloudinary'}
          </span>
        </span>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs text-muted-foreground transition-colors group-hover:border-primary/40 group-hover:text-primary">
          <RefreshCw size={12} /> {fileName ? 'Replace' : 'Upload'}
        </span>
      </span>
    </CldUploadButton>
  )
}
