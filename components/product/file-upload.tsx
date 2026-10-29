'use client'

import { ChangeEvent, useRef, useState } from 'react'
import { FileIcon, Loader2, RefreshCw, UploadCloud } from 'lucide-react'
import { cn } from '@/modals/utils'

interface FileUploadProps {
  onChange: (src: string) => void
  value?: string
  className?: string
}

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'sidssite'

const safeDecode = (value: string) => {
  try { return decodeURIComponent(value) } catch { return value }
}

export const FileUpload = ({ onChange, value, className }: FileUploadProps) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const rawName = value ? safeDecode(value.split('/').pop()?.split('?')[0] || '') : ''

  const chooseFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!cloudName) return setError('Cloudinary is not configured.')
    setUploading(true)
    setError('')
    try {
      const body = new FormData()
      body.append('file', file)
      body.append('upload_preset', uploadPreset)
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`, { method: 'POST', body })
      const result = await response.json() as { secure_url?: string; error?: { message?: string } }
      if (!response.ok || !result.secure_url) throw new Error(result.error?.message || 'Upload failed')
      onChange(result.secure_url)
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
      <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading} className={cn(
        'group block w-full overflow-hidden rounded-xl border-2 border-dashed border-border bg-muted/20 text-left transition-colors',
        'hover:border-primary/60 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60',
        className
      )}>
        <span className="flex items-center gap-4 p-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {uploading ? <Loader2 size={22} className="animate-spin" /> : <FileIcon size={22} />}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium">{rawName ? 'Attached file' : 'Attach a downloadable file'}</span>
            <span className="mt-0.5 block truncate text-xs text-muted-foreground">{uploading ? 'Uploading...' : rawName || 'PDF, ZIP, or any file · uploaded to Cloudinary'}</span>
          </span>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs text-muted-foreground transition-colors group-hover:border-primary/40 group-hover:text-primary">
            {uploading ? <UploadCloud size={12} /> : <RefreshCw size={12} />} {rawName ? 'Replace' : 'Upload'}
          </span>
        </span>
      </button>
      <input ref={inputRef} type="file" onChange={(event) => void chooseFile(event)} className="sr-only" />
      {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
    </>
  )
}
