"use client";

import { CloudinaryImageUpload } from "@/components/product/image-upload";

interface ChatImageUploadProps {
  value?: string;
  onChange: (value: string) => void;
}

export default function ChatImageUpload({ value, onChange }: ChatImageUploadProps) {
  return <CloudinaryImageUpload onChange={onChange} img_src={value} preview={false} aspectRatio={1} className="mx-auto h-9 w-full rounded-lg" />;
}
