"use client";

import { Mail, RefreshCw, Unplug } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface GmailConnectionBarProps {
  connectedEmail: string | null;
  isSyncing: boolean;
  isDisconnecting: boolean;
  onSync: () => void;
  onDisconnect: () => void;
}

export function GmailConnectionBar({ connectedEmail, isSyncing, isDisconnecting, onSync, onDisconnect }: GmailConnectionBarProps) {
  if (!connectedEmail) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Mail className="h-4 w-4" />
          Connect Gmail to sync job-related emails and let this agent help you manage them.
        </div>
        <Button type="button" size="sm" onClick={() => (window.location.href = "/api/email/connect")}>
          <Mail className="mr-1.5 h-3.5 w-3.5" />
          Connect Gmail
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-sm">
        <span className={cn("h-2 w-2 shrink-0 rounded-full bg-success")} />
        <span className="text-foreground">{connectedEmail}</span>
        <span className="text-muted-foreground">connected</span>
      </div>
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onSync} disabled={isSyncing}>
          <RefreshCw className={cn("mr-1.5 h-3.5 w-3.5", isSyncing && "animate-spin")} />
          {isSyncing ? "Syncing..." : "Sync Now"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onDisconnect} disabled={isDisconnecting} className="text-muted-foreground hover:text-destructive">
          <Unplug className="mr-1.5 h-3.5 w-3.5" />
          {isDisconnecting ? "Disconnecting..." : "Disconnect"}
        </Button>
      </div>
    </div>
  );
}
