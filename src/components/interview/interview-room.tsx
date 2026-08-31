"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Bot, Mic, MicOff, Send, Square, Volume2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { pulseGlow } from "@/lib/animations";
import { speak, stopSpeaking, isSpeechSynthesisSupported, isSpeechRecognitionSupported, SpeechRecognizer } from "@/lib/speech";
import type { InterviewQuestionItem } from "@/lib/validations/interview";
import { Waveform } from "./waveform";

interface InterviewRoomProps {
  sessionId: string;
  totalQuestions: number;
  initialQuestion: InterviewQuestionItem;
  onFinished: (sessionId: string) => void;
}

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const TYPE_LABEL: Record<string, string> = {
  technical: "Technical",
  behavioral: "Behavioral",
  hr: "HR",
  aptitude: "Aptitude",
};

export function InterviewRoom({ sessionId, totalQuestions, initialQuestion, onFinished }: InterviewRoomProps) {
  const [question, setQuestion] = React.useState(initialQuestion);
  const [answerText, setAnswerText] = React.useState("");
  const [isRecording, setIsRecording] = React.useState(false);
  const [recordingSeconds, setRecordingSeconds] = React.useState(0);
  const [isSpeaking, setIsSpeaking] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isEnding, setIsEnding] = React.useState(false);

  const recognizerRef = React.useRef<SpeechRecognizer | null>(null);
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const ttsSupported = isSpeechSynthesisSupported();
  const sttSupported = isSpeechRecognitionSupported();

  // Speak each new question aloud automatically, and always clean up
  // synthesis/recognition/timers when the question changes or the room
  // unmounts (leaving the mic listening or a voice talking after
  // navigating away would be a real bug, not just untidy).
  React.useEffect(() => {
    setAnswerText("");
    setRecordingSeconds(0);
    speak(
      question.question,
      () => setIsSpeaking(true),
      () => setIsSpeaking(false)
    );
    return () => {
      stopSpeaking();
      recognizerRef.current?.stop();
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id]);

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setRecordingSeconds((s) => s + 1), 1000);
  };
  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const handleStartSpeaking = () => {
    if (!sttSupported) return;
    stopSpeaking(); // don't let the AI's own voice talk over the mic
    recognizerRef.current = new SpeechRecognizer({
      onInterimResult: (text) => setAnswerText(text),
      onFinalResult: (text) => setAnswerText(text),
      onError: (message) => toast.error("Speech recognition error", { description: message }),
    });
    recognizerRef.current.start();
    setIsRecording(true);
    setRecordingSeconds(0);
    startTimer();
  };

  const handleStopRecording = () => {
    recognizerRef.current?.stop();
    setIsRecording(false);
    stopTimer();
  };

  const submitAnswer = async (text: string) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/agents/interview/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, questionId: question.id, answerText: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");

      toast.success(`Answer scored ${data.score}/100`, { description: data.feedback });

      if (data.isComplete) {
        onFinished(sessionId);
      } else {
        setQuestion(data.nextQuestion);
      }
    } catch (err) {
      toast.error("Couldn't submit answer", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStopAndSubmit = () => {
    if (isRecording) handleStopRecording();
    submitAnswer(answerText);
  };

  const handleEndEarly = async () => {
    if (!window.confirm("End this interview now? You'll get a report based on the questions you've already answered.")) {
      return;
    }
    setIsEnding(true);
    stopSpeaking();
    recognizerRef.current?.stop();
    try {
      const res = await fetch("/api/agents/interview/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      onFinished(data.sessionId);
    } catch (err) {
      toast.error("Couldn't end interview", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
      setIsEnding(false);
    }
  };

  const questionNumber = question.orderIndex + 1;

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-2xl flex-col rounded-xl border border-border bg-background px-6 py-8">
      {/* Progress */}
      <div className="mb-8">
        <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Question {questionNumber} of {totalQuestions}
          </span>
          <span className="text-foreground">{TYPE_LABEL[question.type] ?? question.type}</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-card">
          <motion.div
            className="h-full rounded-full bg-gradient-primary"
            initial={false}
            animate={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          />
        </div>
      </div>

      {/* AI interviewer */}
      <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
        <motion.div
          variants={pulseGlow}
          animate={isSpeaking ? "animate" : undefined}
          className={cn(
            "flex h-16 w-16 items-center justify-center rounded-full bg-gradient-primary",
            !isSpeaking && "opacity-80"
          )}
        >
          <Bot className="h-7 w-7 text-white" />
        </motion.div>

        <p className="max-w-xl text-balance font-heading text-2xl font-semibold leading-snug text-foreground">
          {question.question}
        </p>

        <div className="flex h-12 items-center gap-2 text-xs text-muted-foreground">
          {ttsSupported ? (
            <>
              <Volume2 className={cn("h-3.5 w-3.5", isSpeaking && "text-secondary")} />
              {isSpeaking ? "Speaking..." : "Ready for your answer"}
            </>
          ) : (
            "Voice playback isn't supported in this browser — read the question above."
          )}
        </div>
        <Waveform active={isSpeaking} />
      </div>

      {/* Answer section */}
      <div className="mt-8 space-y-4 border-t border-border pt-6">
        {sttSupported ? (
          <div className="flex items-center justify-center gap-4">
            {!isRecording ? (
              <Button type="button" variant="outline" onClick={handleStartSpeaking} disabled={isSubmitting}>
                <Mic className="mr-2 h-4 w-4" />
                Start Speaking
              </Button>
            ) : (
              <div className="flex items-center gap-3 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-2">
                <motion.span
                  className="h-2.5 w-2.5 rounded-full bg-destructive"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
                <span className="text-sm text-destructive">Recording · {formatTimer(recordingSeconds)}</span>
                <Button type="button" variant="ghost" size="sm" onClick={handleStopRecording}>
                  <MicOff className="mr-1.5 h-3.5 w-3.5" />
                  Pause
                </Button>
              </div>
            )}
          </div>
        ) : (
          <p className="text-center text-xs text-muted-foreground">
            Voice input isn&apos;t supported in this browser — type your answer below.
          </p>
        )}

        <Textarea
          value={answerText}
          onChange={(e) => setAnswerText(e.target.value)}
          placeholder="Your answer will appear here as you speak, or type it directly..."
          className="min-h-[120px]"
          disabled={isSubmitting}
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button type="button" variant="ghost" onClick={handleEndEarly} disabled={isEnding} className="text-destructive hover:text-destructive">
            <Square className="mr-1.5 h-3.5 w-3.5" />
            {isEnding ? "Ending..." : "End Interview Early"}
          </Button>
          <Button type="button" onClick={handleStopAndSubmit} disabled={isSubmitting || isEnding || !answerText.trim()}>
            <Send className="mr-1.5 h-3.5 w-3.5" />
            {isSubmitting ? "Submitting..." : "Stop & Submit Answer"}
          </Button>
        </div>
      </div>
    </div>
  );
}
