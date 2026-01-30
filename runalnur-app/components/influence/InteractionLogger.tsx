"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { X, Phone, Users, Mail, Calendar, MessageSquare, Globe, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { spring } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";

interface InteractionLoggerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: {
    id: string;
    name: string;
    company?: string;
  };
  onSave?: (interaction: InteractionData) => void;
}

interface InteractionData {
  contactId: string;
  type: string;
  sentiment: string;
  notes: string;
  followUpDate?: string;
  followUpNote?: string;
}

const interactionTypes = [
  { id: "call", label: "Call", icon: Phone },
  { id: "meeting", label: "Meeting", icon: Users },
  { id: "email", label: "Email", icon: Mail },
  { id: "event", label: "Event", icon: Calendar },
  { id: "message", label: "Message", icon: MessageSquare },
  { id: "social", label: "Social", icon: Globe },
  { id: "other", label: "Other", icon: MoreHorizontal },
];

const sentimentOptions = [
  { id: "great", label: "Great", emoji: "😊" },
  { id: "good", label: "Good", emoji: "🙂" },
  { id: "neutral", label: "Neutral", emoji: "😐" },
  { id: "cold", label: "Cold", emoji: "😕" },
];

export function InteractionLogger({
  open,
  onOpenChange,
  contact,
  onSave,
}: InteractionLoggerProps) {
  const shouldReduce = useReducedMotion();
  const [type, setType] = useState("call");
  const [sentiment, setSentiment] = useState("good");
  const [notes, setNotes] = useState("");
  const [needsFollowUp, setNeedsFollowUp] = useState(false);
  const [followUpDays, setFollowUpDays] = useState("7");
  const [followUpNote, setFollowUpNote] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    
    const followUpDate = needsFollowUp
      ? new Date(Date.now() + parseInt(followUpDays) * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0]
      : undefined;

    const interaction: InteractionData = {
      contactId: contact.id,
      type,
      sentiment,
      notes,
      followUpDate,
      followUpNote: needsFollowUp ? followUpNote : undefined,
    };

    try {
      // Save to API
      const res = await fetch("/api/interactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(interaction),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        const errMsg =
          typeof (json as { error?: unknown }).error === "string"
            ? String((json as { error?: unknown }).error)
            : undefined;
        throw new Error(errMsg || "Failed to save interaction");
      }

      onSave?.(interaction);
      onOpenChange(false);
      
      // Reset form
      setType("call");
      setSentiment("good");
      setNotes("");
      setNeedsFollowUp(false);
      setFollowUpDays("7");
      setFollowUpNote("");
    } catch (error) {
      console.error("Failed to save interaction:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="text-section">Log Interaction</DialogTitle>
        </DialogHeader>

        <motion.div
          className="space-y-6"
          initial={shouldReduce ? {} : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring.default}
        >
          {/* Contact Info */}
          <div className="flex items-center gap-3 p-3 bg-muted rounded-sm">
            <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-sm font-medium">
              {contact.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)}
            </div>
            <div>
              <div className="font-medium">{contact.name}</div>
              {contact.company && (
                <div className="text-xs text-muted-foreground">{contact.company}</div>
              )}
            </div>
          </div>

          {/* Interaction Type */}
          <div>
            <label className="text-label mb-2 block">Type</label>
            <div className="grid grid-cols-4 gap-2">
              {interactionTypes.map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    onClick={() => setType(t.id)}
                    className={cn(
                      "flex flex-col items-center gap-1 p-2 rounded-sm border transition-colors",
                      type === t.id
                        ? "border-foreground bg-foreground text-background"
                        : "border-border hover:border-foreground/50"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-[10px]">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sentiment */}
          <div>
            <label className="text-label mb-2 block">How did it go?</label>
            <div className="grid grid-cols-4 gap-2">
              {sentimentOptions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSentiment(s.id)}
                  className={cn(
                    "flex flex-col items-center gap-1 p-2 rounded-sm border transition-colors",
                    sentiment === s.id
                      ? "border-foreground bg-foreground text-background"
                      : "border-border hover:border-foreground/50"
                  )}
                >
                  <span className="text-lg">{s.emoji}</span>
                  <span className="text-[10px]">{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-label mb-2 block">Quick notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Key takeaways, action items, etc."
              className="w-full h-20 px-3 py-2 text-sm border border-border rounded-sm bg-background resize-none focus:outline-none focus:ring-1 focus:ring-foreground"
            />
          </div>

          {/* Follow-up */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={needsFollowUp}
                onChange={(e) => setNeedsFollowUp(e.target.checked)}
                className="w-4 h-4 rounded-sm border-border"
              />
              <span className="text-sm">Schedule follow-up</span>
            </label>

            {needsFollowUp && (
              <motion.div
                className="mt-3 space-y-3 pl-6"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={spring.default}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">In</span>
                  <Input
                    type="number"
                    value={followUpDays}
                    onChange={(e) => setFollowUpDays(e.target.value)}
                    className="w-20 h-8"
                    min="1"
                  />
                  <span className="text-sm text-muted-foreground">days</span>
                </div>
                <Input
                  value={followUpNote}
                  onChange={(e) => setFollowUpNote(e.target.value)}
                  placeholder="What to follow up about..."
                  className="h-8"
                />
              </motion.div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
