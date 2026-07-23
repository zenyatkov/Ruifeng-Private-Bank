"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui";

export function ProfilePicture({ currentPicture, initials }: { currentPicture: string | null; initials: string }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert("Max 2MB"); return; }

    setUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      await fetch("/api/profile/picture", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ picture: base64 }),
      });
      setUploading(false);
      router.refresh();
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        {currentPicture ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={currentPicture} alt="Profile" className="h-24 w-24 rounded-2xl object-cover ring-2 ring-jade-500/20" />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-2xl jade-gradient text-2xl font-bold text-white">{initials}</div>
        )}
        <button onClick={() => fileRef.current?.click()} className="absolute -bottom-2 -right-2 rounded-full bg-ink-900 p-2 text-jade-300 hover:bg-ink-800 shadow-lg" disabled={uploading}>
          <Camera className="h-4 w-4" />
        </button>
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      {uploading && <p className="text-xs text-ink-600/60">Uploading...</p>}
    </div>
  );
}
