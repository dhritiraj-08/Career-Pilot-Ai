"use client";

import * as React from "react";
import { Check, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { educationEntrySchema, type EducationEntryValues } from "@/lib/validations/onboarding";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export interface EducationRow extends EducationEntryValues {
  id: string;
}

interface EducationDbRow {
  id: string;
  institution: string;
  degree: string | null;
  field: string | null;
  start_date: string | null;
  end_date: string | null;
  grade: string | null;
}

function rowFromDb(data: EducationDbRow): EducationRow {
  return {
    id: data.id,
    institution: data.institution,
    degree: data.degree ?? "",
    field: data.field ?? "",
    start_year: data.start_date ? new Date(data.start_date).getFullYear() : new Date().getFullYear(),
    end_year: data.end_date ? new Date(data.end_date).getFullYear() : undefined,
    grade: data.grade ?? "",
  };
}

const blankEntry: EducationEntryValues = {
  institution: "",
  degree: "",
  field: "",
  start_year: new Date().getFullYear(),
  end_year: undefined,
  grade: "",
};

interface EducationTabProps {
  userId: string;
  initial: EducationRow[];
  onChange: (rows: EducationRow[]) => void;
}

export function EducationTab({ userId, initial, onChange }: EducationTabProps) {
  const supabase = createClient();
  const [rows, setRows] = React.useState<EducationRow[]>(initial);
  const [editingId, setEditingId] = React.useState<string | "new" | null>(null);
  const [draft, setDraft] = React.useState<EducationEntryValues>(blankEntry);
  const [error, setError] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const startEdit = (row: EducationRow) => {
    setEditingId(row.id);
    setDraft(row);
    setError(null);
  };

  const startAdd = () => {
    setEditingId("new");
    setDraft(blankEntry);
    setError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setError(null);
  };

  const saveEntry = async () => {
    const parsed = educationEntrySchema.safeParse(draft);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check this entry");
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        user_id: userId,
        institution: parsed.data.institution,
        degree: parsed.data.degree,
        field: parsed.data.field,
        start_date: `${parsed.data.start_year}-01-01`,
        end_date: parsed.data.end_year ? `${parsed.data.end_year}-01-01` : null,
        grade: parsed.data.grade || null,
      };

      if (editingId === "new") {
        const { data, error } = await supabase.from("education").insert(payload).select("*").single();
        if (error) throw error;
        const next = [...rows, rowFromDb(data)];
        setRows(next);
        onChange(next);
      } else {
        const { data, error } = await supabase
          .from("education")
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

  const removeEntry = async (id: string) => {
    setDeletingId(id);
    try {
      const { error } = await supabase.from("education").delete().eq("id", id);
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
            onSave={saveEntry}
          />
        ) : (
          <ReadCard
            key={row.id}
            row={row}
            onEdit={() => startEdit(row)}
            onDelete={() => removeEntry(row.id)}
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
          onSave={saveEntry}
        />
      )}

      {editingId === null && (
        <Button type="button" variant="outline" size="sm" onClick={startAdd}>
          <Plus className="mr-2 h-4 w-4" /> Add education
        </Button>
      )}

      {rows.length === 0 && editingId === null && (
        <p className="text-sm text-muted-foreground">No education added yet.</p>
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
  row: EducationRow;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  return (
    <div className="flex items-start justify-between rounded-lg border border-border bg-card p-4">
      <div>
        <p className="text-sm font-medium text-foreground">{row.institution}</p>
        <p className="text-xs text-muted-foreground">
          {row.degree}
          {row.field ? `, ${row.field}` : ""} · {row.start_year}–{row.end_year ?? "Present"}
          {row.grade ? ` · ${row.grade}` : ""}
        </p>
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
  draft: EducationEntryValues;
  setDraft: (d: EducationEntryValues) => void;
  error: string | null;
  isSaving: boolean;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <div className="space-y-3 rounded-lg border border-primary/50 bg-card p-4">
      <div className="space-y-2">
        <Label>Institution</Label>
        <Input value={draft.institution} onChange={(e) => setDraft({ ...draft, institution: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Degree</Label>
          <Input value={draft.degree} onChange={(e) => setDraft({ ...draft, degree: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Field</Label>
          <Input value={draft.field} onChange={(e) => setDraft({ ...draft, field: e.target.value })} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-2">
          <Label>Start year</Label>
          <Input
            type="number"
            value={draft.start_year}
            onChange={(e) => setDraft({ ...draft, start_year: Number(e.target.value) })}
          />
        </div>
        <div className="space-y-2">
          <Label>End year</Label>
          <Input
            type="number"
            value={draft.end_year ?? ""}
            onChange={(e) =>
              setDraft({ ...draft, end_year: e.target.value ? Number(e.target.value) : undefined })
            }
          />
        </div>
        <div className="space-y-2">
          <Label>Grade</Label>
          <Input value={draft.grade} onChange={(e) => setDraft({ ...draft, grade: e.target.value })} />
        </div>
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
