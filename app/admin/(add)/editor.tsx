"use client";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { commands, ContextStore, ICommand } from "@uiw/react-md-editor";
import { ImageUpload } from "@/components/product/image-upload";
import { ImageUpIcon } from "lucide-react";
import { cn } from "@/modals/utils";
import { useTheme } from "next-themes";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

interface EditorOptions {
  className?: string;
  onChange: ((value?: string, event?: React.ChangeEvent<HTMLTextAreaElement>, state?: ContextStore) => void) | undefined
  value?: string;
  height?: number;
  placeholder?: string;
}

function MyEditor({ className, onChange, value, height = 480, placeholder }: EditorOptions) {
  const { theme, systemTheme } = useTheme()
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const resolveRef = useRef<((src: string) => void) | null>(null)

  const openUploadModal = useCallback(() => {
    return new Promise<string>((resolve) => {
      resolveRef.current = resolve
      setIsUploadOpen(true)
    })
  }, [])

  const closeUploadModal = useCallback((src?: string) => {
    resolveRef.current?.(src ?? "")
    resolveRef.current = null
    setIsUploadOpen(false)
  }, [])

  // Resolve any pending upload promise if the editor goes away
  useEffect(() => {
    return () => {
      resolveRef.current?.("")
      resolveRef.current = null
    }
  }, [])

  const imageUploadCommand = useMemo<ICommand>(() => ({
    name: "imageUpload",
    keyCommand: "imageUpload",
    buttonProps: { "aria-label": "Insert image" },
    icon: <ImageUpIcon className="w-4 h-4" />,
    execute: (_state, api) => {
      openUploadModal().then((imageUrl) => {
        if (imageUrl) {
          api.replaceSelection(`![Image description](${imageUrl})\n`)
        }
      })
    },
  }), [openUploadModal])

  const isDark = ["dark", "blue", "purple", "aqua"].includes(((theme == "system" ? systemTheme : theme) || "") as string)

  return (
    <div
      className={cn("w-full overflow-hidden rounded-xl border bg-card", className)}
      data-color-mode={isDark ? "dark" : "light"}
    >
      <MDEditor
        className="w-full"
        visibleDragbar={false}
        height={height}
        value={value ?? ""}
        onChange={onChange}
        preview="live"
        textareaProps={{ placeholder: placeholder ?? "Write in Markdown… Use the toolbar to format your content." }}
        commands={[
          ...(commands.getCommands().slice(0, -1)),
          // Custom image upload command
          imageUploadCommand,
        ]}
      />
      {isUploadOpen && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Upload an image"
          onMouseDown={(event) => { if (event.target === event.currentTarget) closeUploadModal() }}
        >
          <div className="w-full max-w-md rounded-2xl border bg-card p-5 shadow-2xl">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Insert an image</h2>
              <p className="mt-1 text-sm text-muted-foreground">Upload an image to insert it at the cursor.</p>
            </div>
            <ImageUpload onChange={(src) => closeUploadModal(src)} />
            <button
              type="button"
              onClick={() => closeUploadModal()}
              className="mt-4 h-9 w-full rounded-md border text-sm font-medium transition-colors hover:bg-muted"
            >
              Cancel
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default MyEditor;
