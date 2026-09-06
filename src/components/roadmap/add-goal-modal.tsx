"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { Sparkles } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { GOAL_TYPES, GOAL_TYPE_LABELS, type GoalType } from "@/lib/validations/roadmap";

export interface NewGoalValues {
  title: string;
  description: string;
  targetDate: string;
  goalType: GoalType;
}

interface AddGoalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSubmitting: boolean;
  onSubmit: (values: NewGoalValues) => void;
}

const todayIso = () => new Date().toISOString().slice(0, 10);

export function AddGoalModal({ open, onOpenChange, isSubmitting, onSubmit }: AddGoalModalProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<NewGoalValues>({
    defaultValues: { title: "", description: "", targetDate: "", goalType: "job" },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) reset();
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Set a new goal</DialogTitle>
          <DialogDescription>
            Describe what you&apos;re working toward and we&apos;ll build a week-by-week plan for it.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit((values) => onSubmit(values))}
          className="space-y-4"
          noValidate
        >
          <div className="space-y-2">
            <Label htmlFor="goal-title">Goal title</Label>
            <Input
              id="goal-title"
              placeholder="e.g. Get an AI Engineer job"
              {...register("title", { required: true })}
            />
            {errors.title && <p className="text-xs text-destructive">Goal title is required</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal-description">Description</Label>
            <Textarea
              id="goal-description"
              placeholder="A bit more detail helps the plan be more specific..."
              className="min-h-[90px]"
              {...register("description")}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="goal-target-date">Target date</Label>
              <Input id="goal-target-date" type="date" min={todayIso()} {...register("targetDate", { required: true })} />
              {errors.targetDate && <p className="text-xs text-destructive">Target date is required</p>}
            </div>
            <div className="space-y-2">
              <Label>Goal type</Label>
              <Controller
                control={control}
                name="goalType"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GOAL_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {GOAL_TYPE_LABELS[type]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
            <Sparkles className="mr-2 h-4 w-4" />
            {isSubmitting ? "Generating roadmap..." : "Generate Roadmap with AI"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
