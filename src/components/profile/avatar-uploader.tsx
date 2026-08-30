"use client";

import * as React from "react";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const MAX_SIZE_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface AvatarUploaderProps {
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  onUploaded: (url: string) => void;
}

/** Uploads to a fixed `${userId}/avatar` storage key with upsert, so a
 * new photo always overwrites the same object instead of accumulating
 * orphaned files. Requires the "avatars" bucket from docs/storage-setup.sql. */
export function AvatarUploader({ userId, fullName, avatarUrl, onUploaded }: AvatarUploaderProps) {
  const supabase = createClient();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = React.useState(false);

  const initials =
    fullName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?";

  const handleFile = async (file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Unsupported file type", { description: "Use JPG, PNG, or WEBP." });
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      toast.error("File too large", { description: "Max size is 2MB." });
      return;
    }

    setIsUploading(true);
    try {
      const path = `${userId}/avatar`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      // Same key every upload, so cache-bust the URL to show the new photo immediately.
      const url = `${data.publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from("profiles")
        .upsert({ user_id: userId, avatar_url: url }, { onConflict: "user_id" });
      if (updateError) throw updateError;

      onUploaded(url);
      toast.success("Profile photo updated");
    } catch (err) {
      toast.error("Couldn't upload photo", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="relative mx-auto h-24 w-24">
      <Avatar className="h-24 w-24 border-2 border-border">
        {avatarUrl && <AvatarImage src={avatarUrl} alt={fullName} />}
        <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
      </Avatar>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        className={cn(
          "absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-gradient-primary text-white transition-transform duration-fast hover:scale-105 disabled:opacity-60"
        )}
        aria-label="Change profile photo"
      >
        {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
