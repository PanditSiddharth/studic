'use client'
import { CldUploadButton } from 'next-cloudinary'
import Image from 'next/image'
import { ImagePlus, RefreshCw, UploadCloud } from 'lucide-react'
import { cn } from '@/modals/utils'

interface ImageUploadProps {
  img_src?: string
  onChange: (src: string) => void
  className?: string
}

interface CloudinaryUploadResponse {
  info: {
    secure_url: string
  }
}

const buttonProps = { type: "button" } as const

export const ImageUpload = ({ onChange, img_src, className }: ImageUploadProps) => {
  return (
    <CldUploadButton
      {...buttonProps}
      className={cn(
        'group block w-full overflow-hidden rounded-xl border-2 border-dashed border-border bg-muted/20 text-left transition-colors',
        'hover:border-primary/60 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className
      )}
      uploadPreset="sidssite"
      options={{
        maxFiles: 1,
        cropping: true,
        croppingAspectRatio: 16 / 9,
        croppingCoordinatesMode: 'custom',
        croppingDefaultSelectionRatio: 16 / 9,
        croppingShowDimensions: true,
        croppingValidateDimensions: true,
        multiple: false,
      }}
      onSuccess={(value: unknown) => {
        const response = value as CloudinaryUploadResponse
        if (response?.info?.secure_url) onChange(response.info.secure_url)
      }}
    >
      {img_src ? (
        <span className="relative block aspect-video w-full overflow-hidden bg-muted">
          <Image
            src={img_src}
            alt="Selected cover"
            fill
            sizes="(max-width: 768px) 100vw, 420px"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
          <span className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 text-xs font-medium text-black shadow">
              <RefreshCw size={13} /> Replace image
            </span>
          </span>
        </span>
      ) : (
        <span className="flex aspect-video w-full flex-col items-center justify-center gap-2 p-4 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ImagePlus size={20} />
          </span>
          <span className="text-sm font-medium">Upload a cover image</span>
          <span className="text-xs text-muted-foreground">PNG, JPG or WebP · 16:9 recommended</span>
        </span>
      )}
    </CldUploadButton>
  )
}

export const ImageUploadHint = () => (
  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
    <UploadCloud size={13} /> Images are stored on Cloudinary.
  </p>
)
