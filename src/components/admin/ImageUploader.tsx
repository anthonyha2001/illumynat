"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { cn } from "@/utils/cn";

interface Props {
  urls: string[];
  onChange: (urls: string[]) => void;
  maxImages?: number;
}

interface UploadingFile {
  id: string;
  name: string;
  progress: "uploading" | "done" | "error";
  error?: string;
}

const ACCEPTED = "image/jpeg,image/png,image/webp,image/avif";

export function ImageUploader({ urls, onChange, maxImages = 10 }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<UploadingFile[]>([]);
  const [dragOver, setDragOver]   = useState(false);

  async function uploadFile(file: File) {
    const id = `${Date.now()}-${file.name}`;
    setUploading((prev) => [...prev, { id, name: file.name, progress: "uploading" }]);

    try {
      // 1. Get signed upload URL from our API
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to get upload URL");

      // 2. PUT file directly to Supabase Storage
      const uploadRes = await fetch(data.signedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!uploadRes.ok) throw new Error("Upload to storage failed");

      // 3. Add public URL to list
      onChange([...urls, data.publicUrl]);
      setUploading((prev) => prev.map((u) => u.id === id ? { ...u, progress: "done" } : u));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setUploading((prev) => prev.map((u) => u.id === id ? { ...u, progress: "error", error: msg } : u));
    } finally {
      // Remove done/error items after a short delay
      setTimeout(() => setUploading((prev) => prev.filter((u) => u.id !== id)), 2000);
    }
  }

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const remaining = maxImages - urls.length;
    Array.from(files).slice(0, remaining).forEach(uploadFile);
  }

  function removeUrl(index: number) {
    onChange(urls.filter((_, i) => i !== index));
  }

  function moveUrl(from: number, to: number) {
    const next = [...urls];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  }

  return (
    <div className="space-y-3">
      {/* Existing images */}
      {urls.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {urls.map((url, i) => (
            <div key={url} className="relative group">
              <div className="relative aspect-square bg-bg-subtle overflow-hidden border border-border">
                <Image src={url} alt={`Image ${i + 1}`} fill sizes="120px" className="object-cover" />
                {i === 0 && (
                  <span className="absolute bottom-0 left-0 right-0 bg-accent/90 text-text-on-gold font-body text-[8px] tracking-widest uppercase text-center py-0.5">
                    Primary
                  </span>
                )}
              </div>
              {/* Controls */}
              <div className="absolute inset-0 bg-text/40 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center gap-1">
                {i > 0 && (
                  <button
                    type="button"
                    onClick={() => moveUrl(i, i - 1)}
                    title="Move left"
                    className="w-6 h-6 bg-white text-text font-body text-[10px] flex items-center justify-center hover:bg-accent hover:text-text-on-gold transition-colors"
                  >
                    ←
                  </button>
                )}
                {i < urls.length - 1 && (
                  <button
                    type="button"
                    onClick={() => moveUrl(i, i + 1)}
                    title="Move right"
                    className="w-6 h-6 bg-white text-text font-body text-[10px] flex items-center justify-center hover:bg-accent hover:text-text-on-gold transition-colors"
                  >
                    →
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeUrl(i)}
                  title="Remove"
                  className="w-6 h-6 bg-error text-white font-body text-[10px] flex items-center justify-center hover:opacity-90 transition-opacity"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload area */}
      {urls.length < maxImages && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "border-2 border-dashed px-4 py-8 text-center cursor-pointer transition-colors duration-150",
            dragOver
              ? "border-accent bg-accent/5"
              : "border-border hover:border-accent/50 hover:bg-bg-subtle"
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED}
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <p className="font-body text-sm text-text-muted">
            Drop images here or <span className="text-accent">browse</span>
          </p>
          <p className="font-body text-[11px] text-text-faint mt-1">
            JPG, PNG, WebP, AVIF · First image is primary · {urls.length}/{maxImages}
          </p>
        </div>
      )}

      {/* Upload progress */}
      {uploading.length > 0 && (
        <div className="space-y-1.5">
          {uploading.map((u) => (
            <div key={u.id} className="flex items-center gap-2 font-body text-[11px]">
              <span className={cn(
                "w-1.5 h-1.5 rounded-full shrink-0",
                u.progress === "uploading" ? "bg-accent animate-pulse" :
                u.progress === "done"      ? "bg-success" : "bg-error"
              )} />
              <span className="text-text-muted truncate">{u.name}</span>
              <span className={cn(
                "ml-auto shrink-0",
                u.progress === "error" ? "text-error" : "text-text-muted"
              )}>
                {u.progress === "uploading" ? "Uploading…" :
                 u.progress === "done"      ? "Done" : u.error ?? "Error"}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* URL fallback */}
      <details className="group">
        <summary className="font-body text-[11px] text-text-muted hover:text-accent cursor-pointer list-none transition-colors duration-150">
          + Add by URL instead
        </summary>
        <div className="mt-2 flex gap-2">
          <input
            type="url"
            placeholder="https://…"
            className="flex-1 bg-bg border border-border px-3 py-2 font-body text-sm text-text placeholder:text-text-faint focus:border-accent focus:outline-none transition-colors duration-200"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const val = (e.target as HTMLInputElement).value.trim();
                if (val && !urls.includes(val)) {
                  onChange([...urls, val]);
                  (e.target as HTMLInputElement).value = "";
                }
              }
            }}
          />
          <button
            type="button"
            onClick={(e) => {
              const input = (e.currentTarget.previousSibling as HTMLInputElement);
              const val = input.value.trim();
              if (val && !urls.includes(val)) {
                onChange([...urls, val]);
                input.value = "";
              }
            }}
            className="px-3 py-2 bg-bg-subtle border border-border font-body text-[10px] tracking-widest uppercase text-text-muted hover:text-accent hover:border-accent transition-colors duration-150"
          >
            Add
          </button>
        </div>
      </details>
    </div>
  );
}
