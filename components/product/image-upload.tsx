'use client'

import Image from 'next/image'
import { ChangeEvent, PointerEvent, useEffect, useRef, useState } from 'react'
import { ImagePlus, Loader2, RefreshCw, UploadCloud, X, ZoomIn, ZoomOut } from 'lucide-react'
import { cn } from '@/modals/utils'

interface ImageUploadProps {
  img_src?: string
  onChange: (src: string) => void
  className?: string
  aspectRatio?: number
  preview?: boolean
}

type CropperProps = {
  file: File
  aspectRatio: number
  onCancel: () => void
  onUploaded: (src: string) => void
}

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'sidssite'

async function uploadToCloudinary(blob: Blob, fileName: string) {
  if (!cloudName) throw new Error('Cloudinary is not configured. Add NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME.')
  const body = new FormData()
  body.append('file', blob, fileName)
  body.append('upload_preset', uploadPreset)
  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body,
  })
  const result = await response.json() as { secure_url?: string; error?: { message?: string } }
  if (!response.ok || !result.secure_url) {
    throw new Error(result.error?.message || 'Cloudinary upload failed')
  }
  return result.secure_url
}

function ImageCropper({ file, aspectRatio, onCancel, onUploaded }: CropperProps) {
  const [preview, setPreview] = useState('')
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 })
  const cropAreaRef = useRef<HTMLDivElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const moveImage = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragging) return
    const area = cropAreaRef.current
    if (!area) return
    const maxX = area.clientWidth * Math.max(0, zoom - 1) / 2 + area.clientWidth * 0.18
    const maxY = area.clientHeight * Math.max(0, zoom - 1) / 2 + area.clientHeight * 0.18
    setPan({
      x: Math.max(-maxX, Math.min(maxX, dragStart.current.panX + event.clientX - dragStart.current.x)),
      y: Math.max(-maxY, Math.min(maxY, dragStart.current.panY + event.clientY - dragStart.current.y)),
    })
  }

  const upload = async () => {
    if (!preview || uploading) return
    setUploading(true)
    setError('')
    try {
      const image = new window.Image()
      image.src = preview
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve()
        image.onerror = () => reject(new Error('Could not read this image'))
      })

      const sourceRatio = image.naturalWidth / image.naturalHeight
      let cropWidth = image.naturalWidth
      let cropHeight = image.naturalHeight
      if (sourceRatio > aspectRatio) cropWidth = cropHeight * aspectRatio
      else cropHeight = cropWidth / aspectRatio
      cropWidth /= zoom
      cropHeight /= zoom
      const area = cropAreaRef.current
      const visualScale = area
        ? Math.max(area.clientWidth / image.naturalWidth, area.clientHeight / image.naturalHeight) * zoom
        : zoom
      const centerX = image.naturalWidth / 2 - pan.x / visualScale
      const centerY = image.naturalHeight / 2 - pan.y / visualScale
      const sourceX = Math.max(0, Math.min(image.naturalWidth - cropWidth, centerX - cropWidth / 2))
      const sourceY = Math.max(0, Math.min(image.naturalHeight - cropHeight, centerY - cropHeight / 2))

      const canvas = document.createElement('canvas')
      canvas.width = Math.round(Math.min(1600, cropWidth))
      canvas.height = Math.round(canvas.width / aspectRatio)
      const context = canvas.getContext('2d')
      if (!context) throw new Error('Your browser cannot process this image')
      context.imageSmoothingQuality = 'high'
      context.drawImage(
        image,
        sourceX,
        sourceY,
        cropWidth,
        cropHeight,
        0,
        0,
        canvas.width,
        canvas.height,
      )
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob((value) => value ? resolve(value) : reject(new Error('Could not prepare the cropped image')), 'image/jpeg', 0.9)
      )
      onUploaded(await uploadToCloudinary(blob, `studic-${Date.now()}.jpg`))
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-background p-4 shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Crop image</h2>
            <p className="text-xs text-muted-foreground">Adjust the zoom and keep the subject inside the frame.</p>
          </div>
          <button type="button" onClick={onCancel} className="rounded-full p-2 hover:bg-muted" aria-label="Close cropper">
            <X size={18} />
          </button>
        </div>
        <div
          ref={cropAreaRef}
          className={cn("relative mx-auto max-h-[55vh] touch-none select-none overflow-hidden rounded-xl bg-black", dragging ? "cursor-grabbing" : "cursor-grab")}
          style={{ aspectRatio }}
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId)
            dragStart.current = { x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y }
            setDragging(true)
          }}
          onPointerMove={moveImage}
          onPointerUp={() => setDragging(false)}
          onPointerCancel={() => setDragging(false)}
        >
          {preview ? (
            <Image
              src={preview}
              alt="Crop preview"
              fill
              unoptimized
              draggable={false}
              className="pointer-events-none object-contain transition-transform duration-75"
              style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
            />
          ) : null}
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,.45)]"
            style={{ width: "92%", aspectRatio }}
          />
        </div>
        <div className="mt-4 flex items-center gap-3">
          <ZoomOut size={16} className="text-muted-foreground" />
          <input
            type="range"
            min="1"
            max="3"
            step="0.05"
            value={zoom}
            onChange={(event) => {
              setZoom(Number(event.target.value))
              setPan({ x: 0, y: 0 })
            }}
            className="w-full accent-primary"
            aria-label="Image zoom"
          />
          <ZoomIn size={16} className="text-muted-foreground" />
        </div>
        {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="rounded-lg border px-3 py-2 text-sm">Cancel</button>
          <button type="button" onClick={() => void upload()} disabled={uploading} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-60">
            {uploading ? <Loader2 size={15} className="animate-spin" /> : <UploadCloud size={15} />}
            {uploading ? 'Uploading...' : 'Crop & upload'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function CloudinaryImageUpload({ onChange, img_src, className, aspectRatio = 16 / 9, preview = true }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState('')

  const chooseFile = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0]
    event.target.value = ''
    if (!selected) return
    if (!selected.type.startsWith('image/')) return setError('Choose a JPG, PNG or WebP image.')
    if (selected.size > 5_000_000) return setError('Image must be smaller than 5 MB.')
    setError('')
    setFile(selected)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={cn(
          'group block w-full overflow-hidden rounded-xl border-2 border-dashed border-border bg-muted/20 text-left transition-colors',
          'hover:border-primary/60 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          className,
        )}
      >
        {img_src && preview ? (
          <span className="relative block w-full overflow-hidden bg-muted" style={{ aspectRatio }}>
            <Image src={img_src} alt="Selected cover" fill sizes="(max-width: 768px) 100vw, 420px" className="object-cover" />
            <span className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity group-hover:opacity-100">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 text-xs font-medium text-black shadow"><RefreshCw size={13} /> Replace image</span>
            </span>
          </span>
        ) : (
          <span className="flex w-full flex-col items-center justify-center gap-2 p-4 text-center" style={{ aspectRatio }}>
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary"><ImagePlus size={20} /></span>
            <span className="text-sm font-medium">{img_src ? 'Change image' : 'Upload a cover image'}</span>
            <span className="text-xs text-muted-foreground">JPG, PNG or WebP · crop before upload</span>
          </span>
        )}
      </button>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseFile} className="sr-only" />
      {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
      {file ? <ImageCropper file={file} aspectRatio={aspectRatio} onCancel={() => setFile(null)} onUploaded={(src) => { onChange(src); setFile(null) }} /> : null}
    </>
  )
}

export const ImageUpload = (props: ImageUploadProps) => <CloudinaryImageUpload {...props} />

export const ImageUploadHint = () => (
  <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><UploadCloud size={13} /> Images are cropped and uploaded to Cloudinary.</p>
)
