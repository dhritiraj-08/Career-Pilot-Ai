"use client";

import { AvatarUploader } from "./avatar-uploader";
import { CompletionRing } from "./completion-ring";

interface ProfileSidebarProps {
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  currentJobRole: string | null;
  currentCompany: string | null;
  city: string | null;
  completionPercent: number;
  skillsCount: number;
  certificationsCount: number;
  onAvatarUploaded: (url: string) => void;
}

export function ProfileSidebar({
  userId,
  fullName,
  avatarUrl,
  currentJobRole,
  currentCompany,
  city,
  completionPercent,
  skillsCount,
  certificationsCount,
  onAvatarUploaded,
}: ProfileSidebarProps) {
  return (
    <div className="h-fit space-y-6 rounded-lg border border-border bg-card p-6 text-center lg:sticky lg:top-6">
      <AvatarUploader userId={userId} fullName={fullName} avatarUrl={avatarUrl} onUploaded={onAvatarUploaded} />

      <div>
        <h2 className="font-heading text-lg font-semibold text-foreground">{fullName || "Your name"}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {currentJobRole
            ? `${currentJobRole}${currentCompany ? ` · ${currentCompany}` : ""}`
            : city || "—"}
        </p>
      </div>

      <div className="flex flex-col items-center gap-2">
        <CompletionRing percent={completionPercent} />
        <p className="text-xs text-muted-foreground">Profile completion</p>
      </div>

      <div className="grid grid-cols-2 gap-3 border-t border-border pt-4">
        <div>
          <p className="font-heading text-lg font-semibold text-foreground">{skillsCount}</p>
          <p className="text-xs text-muted-foreground">Skills</p>
        </div>
        <div>
          <p className="font-heading text-lg font-semibold text-foreground">{certificationsCount}</p>
          <p className="text-xs text-muted-foreground">Certifications</p>
        </div>
      </div>
    </div>
  );
}
