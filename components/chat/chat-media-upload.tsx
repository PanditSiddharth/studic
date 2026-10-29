"use client";

import { useRef, useState } from "react";
import { FileIcon, ImagePlus, Loader2, UploadCloud } from "lucide-react";
import type { ChatAttachment, ChatAttachmentKind } from "@/modals/chat.model";

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "sidssite";

export default function ChatMediaUpload({
  allowImages,
  allowDocuments,
  onUploaded,
}: {
  allowImages: boolean;
  allowDocuments: boolean;
  onUploaded: (attachment: ChatAttachment) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const accept = [allowImages ? "image/*" : "", allowDocuments ? ".pdf,.zip,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv" : ""].filter(Boolean).join(",");
  if (!accept) return null;

  const choose = async (file: File) => {
    if (!cloudName) { setError("Cloudinary is not configured."); return; }
    const kind: ChatAttachmentKind = file.type.startsWith("image/") ? "image" : "document";
    if ((kind === "image" && !allowImages) || (kind === "document" && !allowDocuments)) {
      setError("This file type is disabled by the administrator.");
      return;
    }
    if (file.size > 15 * 1024 * 1024) { setError("Keep attachments under 15 MB."); return; }
    setUploading(true);
    setError("");
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("upload_preset", uploadPreset);
      const resource = kind === "image" ? "image" : "raw";
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resource}/upload`, { method: "POST", body });
      const result = await response.json() as { secure_url?: string; error?: { message?: string } };
      if (!response.ok || !result.secure_url) throw new Error(result.error?.message || "Upload failed");
      onUploaded({ url: result.secure_url, name: file.name, mimeType: file.type || "application/octet-stream", kind });
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return <div className="shrink-0">
    <button type="button" disabled={uploading} onClick={() => inputRef.current?.click()} className="grid h-10 w-10 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50" aria-label="Attach photo or document" title="Attach photo or document">
      {uploading ? <Loader2 size={17} className="animate-spin" /> : allowImages ? <ImagePlus size={18} /> : <FileIcon size={18} />}
    </button>
    <input ref={inputRef} type="file" accept={accept} className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; if (file) void choose(file); }} />
    {error ? <p className="absolute mt-1 max-w-[220px] text-[10px] text-destructive">{error}</p> : null}
  </div>;
}
