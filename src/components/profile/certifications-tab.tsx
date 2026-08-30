"use client";

import * as React from "react";
import { Check, ExternalLink, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { certificationEntrySchema, type CertificationEntryValues } from "@/lib/validations/profile";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export interface CertificationRow extends CertificationEntryValues {
  id: string;
}

interface CertificationDbRow {
  id: string;
  name: string;
  issuer: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  credential_url: string | null;
}

function rowFromDb(data: CertificationDbRow): CertificationRow {
  return {
    id: data.id,
    name: data.name,
    issuer: data.issuer ?? "",
    issue_date: data.issue_date ?? "",
    expiry_date: data.expiry_date ?? "",
    credential_url: data.credential_url ?? "",
  };
}

const blankCert: CertificationEntryValues = {
  name: "",
  issuer: "",
  issue_date: "",
  expiry_date: "",
  credential_url: "",
};

interface CertificationsTabProps {
  userId: string;
  initial: CertificationRow[];
  onChange: (rows: CertificationRow[]) => void;
}

export function CertificationsTab({ userId, initial, onChange }: CertificationsTabProps) {
  const supabase = createClient();
  const [rows, setRows] = React.useState<CertificationRow[]>(initial);
  const [editingId, setEditingId] = React.useState<string | "new" | null>(null);
  const [draft, setDraft] = React.useState<CertificationEntryValues>(blankCert);
  const [error, setError] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const startEdit = (row: CertificationRow) => {
    setEditingId(row.id);
    setDraft(row);
    setError(null);
  };

  const startAdd = () => {
    setEditingId("new");
    setDraft(blankCert);
    setError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setError(null);
  };

  const saveCert = async () => {
    const parsed = certificationEntrySchema.safeParse(draft);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check this entry");
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        user_id: userId,
        name: parsed.data.name,
        issuer: parsed.data.issuer,
        issue_date: parsed.data.issue_date,
        expiry_date: parsed.data.expiry_date || null,
        credential_url: parsed.data.credential_url || null,
      };

      if (editingId === "new") {
        const { data, error } = await supabase.from("certifications").insert(payload).select("*").single();
        if (error) throw error;
        const next = [...rows, rowFromDb(data)];
        setRows(next);
        onChange(next);
      } else {
        const { data, error } = await supabase
          .from("certifications")
          .update(payload)
          .eq("id", editingId)
          .select("*")
          .single();
        if (error) throw error;
        const next = rows.map((r) => (r.id === editingId ? rowFromDb(data) : r));
        setRows(next);
        onChange(next);
      }
      setEditingId(null);
    } catch (err) {
      toast.error("Couldn't save", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const removeCert = async (id: string) => {
    setDeletingId(id);
    try {
      const { error } = await supabase.from("certifications").delete().eq("id", id);
      if (error) throw error;
      const next = rows.filter((r) => r.id !== id);
      setRows(next);
      onChange(next);
    } catch (err) {
      toast.error("Couldn't remove", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {rows.map((row) =>
        editingId === row.id ? (
          <EditCard
            key={row.id}
            draft={draft}
            setDraft={setDraft}
            error={error}
            isSaving={isSaving}
            onCancel={cancelEdit}
            onSave={saveCert}
          />
        ) : (
          <ReadCard
            key={row.id}
            row={row}
            onEdit={() => startEdit(row)}
            onDelete={() => removeCert(row.id)}
            isDeleting={deletingId === row.id}
          />
        )
      )}

      {editingId === "new" && (
        <EditCard
          draft={draft}
          setDraft={setDraft}
          error={error}
          isSaving={isSaving}
          onCancel={cancelEdit}
          onSave={saveCert}
        />
      )}

      {editingId === null && (
        <Button type="button" variant="outline" size="sm" onClick={startAdd}>
          <Plus className="mr-2 h-4 w-4" /> Add certification
        </Button>
      )}

      {rows.length === 0 && editingId === null && (
        <p className="text-sm text-muted-foreground">No certifications added yet.</p>
      )}
    </div>
  );
}

function ReadCard({
  row,
  onEdit,
  onDelete,
  isDeleting,
}: {
  row: CertificationRow;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  return (
    <div className="flex items-start justify-between rounded-lg border border-border bg-card p-4">
      <div>
        <p className="text-sm font-medium text-foreground">{row.name}</p>
        <p className="text-xs text-muted-foreground">
          {row.issuer} · {row.issue_date}
          {row.expiry_date ? ` – ${row.expiry_date}` : ""}
        </p>
        {row.credential_url && (
          <a
            href={row.credential_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-1 text-xs text-secondary hover:underline"
          >
            View credential <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button type="button" variant="ghost" size="icon" onClick={onEdit} aria-label="Edit">
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="icon" onClick={onDelete} disabled={isDeleting} aria-label="Delete">
          {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
        </Button>
      </div>
    </div>
  );
}

function EditCard({
  draft,
  setDraft,
  error,
  isSaving,
  onCancel,
  onSave,
}: {
  draft: CertificationEntryValues;
  setDraft: (d: CertificationEntryValues) => void;
  error: string | null;
  isSaving: boolean;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <div className="space-y-3 rounded-lg border border-primary/50 bg-card p-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Name</Label>
          <Input
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            placeholder="AWS Certified..."
          />
        </div>
        <div className="space-y-2">
          <Label>Issuer</Label>
          <Input
            value={draft.issuer}
            onChange={(e) => setDraft({ ...draft, issuer: e.target.value })}
            placeholder="Amazon Web Services"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Issue date</Label>
          <Input
            type="date"
            value={draft.issue_date}
            onChange={(e) => setDraft({ ...draft, issue_date: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Expiry date (optional)</Label>
          <Input
            type="date"
            value={draft.expiry_date}
            onChange={(e) => setDraft({ ...draft, expiry_date: e.target.value })}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Credential URL (optional)</Label>
        <Input
          value={draft.credential_url}
          onChange={(e) => setDraft({ ...draft, credential_url: e.target.value })}
          placeholder="https://..."
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={isSaving}>
          <X className="mr-1 h-3.5 w-3.5" /> Cancel
        </Button>
        <Button type="button" size="sm" onClick={onSave} disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Check className="mr-1 h-3.5 w-3.5" />
          )}
          Save
        </Button>
      </div>
    </div>
  );
}
