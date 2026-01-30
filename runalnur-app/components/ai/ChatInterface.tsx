"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Sparkles, Zap, Paperclip, X, FileImage, FileText, Loader2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/motion/tokens";
import type { ChatMessage } from "@/lib/types";
import { useApi } from "@/lib/hooks/useApi";

type AIProvider = "anthropic" | "gemini";

interface ExtendedChatMessage extends ChatMessage {
  provider?: AIProvider;
  attachments?: Array<{
    name: string;
    type: string;
    preview?: string;
  }>;
  pendingActions?: Array<{
    id: string;
    type: string;
    description: string;
    data: unknown;
  }>;
}

interface AttachedFile {
  id: string;
  file: File;
  preview?: string;
  base64?: string;
}

interface ChatInterfaceProps {
  className?: string;
}

interface AIStatus {
  providers: {
    anthropic: boolean;
    openai: boolean;
    gemini: boolean;
  };
  serviceRole: boolean;
}

const quickActions = [
  { label: "TODAY'S PRIORITIES", action: "priorities" },
  { label: "STATUS CHECK", action: "status" },
  { label: "CREATE TASK", action: "create_task" },
];

const suggestedPrompts = [
  "What should I focus on right now?",
  "Give me a status check on all arms",
  "What's overdue that needs immediate attention?",
  "Create a task for Nova: Review RunAlNur auth flow",
];

const ACCEPTED_FILE_TYPES = [
  "image/jpeg",
  "image/png", 
  "image/gif",
  "image/webp",
  "application/pdf",
];

export function ChatInterface({ className }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ExtendedChatMessage[]>([
    {
      id: "1",
      role: "assistant",
      content: "I'm your COO. I manage priorities, track accountability, and ensure things get done across House Al Nur. What do you need?\n\nYou can also share files, images, or screenshots with me - I'll analyze them and help you organize the information.",
      timestamp: new Date().toISOString(),
      provider: "anthropic",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>("anthropic");
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);
  const { data: aiStatus } = useApi<AIStatus>(
    "/api/ai/status",
    { providers: { anthropic: false, openai: false, gemini: false }, serviceRole: false }
  );

  const hasProvider =
    aiStatus.providers.anthropic || aiStatus.providers.openai || aiStatus.providers.gemini;
  const missingProviders = [
    !aiStatus.providers.anthropic && "Anthropic",
    !aiStatus.providers.openai && "OpenAI",
    !aiStatus.providers.gemini && "Gemini",
  ].filter(Boolean);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // File handling functions
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
    });
  };

  const handleFilesAdded = useCallback(async (files: File[]) => {
    const validFiles = files.filter(
      (file) => ACCEPTED_FILE_TYPES.includes(file.type) && attachedFiles.length < 5
    );

    const newAttachments: AttachedFile[] = await Promise.all(
      validFiles.map(async (file) => {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        let preview: string | undefined;
        let base64: string | undefined;

        if (file.type.startsWith("image/")) {
          preview = URL.createObjectURL(file);
        }

        try {
          base64 = await fileToBase64(file);
        } catch {
          console.error("Failed to convert file to base64");
        }

        return { id, file, preview, base64 };
      })
    );

    setAttachedFiles((prev) => [...prev, ...newAttachments].slice(0, 5));
  }, [attachedFiles.length]);

  const handleFileRemove = useCallback((id: string) => {
    setAttachedFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounterRef.current = 0;

    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFilesAdded(droppedFiles);
  }, [handleFilesAdded]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    submitMessage(input);
  };

  const submitMessage = async (message: string) => {
    if ((!message.trim() && attachedFiles.length === 0) || isLoading) return;

    const userMessage: ExtendedChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: message.trim() || (attachedFiles.length > 0 ? "Analyze these files" : ""),
      timestamp: new Date().toISOString(),
      attachments: attachedFiles.map((f) => ({
        name: f.file.name,
        type: f.file.type,
        preview: f.preview,
      })),
    };

    // Prepare files for API
    const filesToSend = attachedFiles.map((f) => ({
      name: f.file.name,
      type: f.file.type,
      base64: f.base64,
    }));

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setAttachedFiles([]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: userMessage.content,
          provider: selectedProvider,
          files: filesToSend.length > 0 ? filesToSend : undefined,
        }),
      });
      const json = await response.json();

      if (!response.ok || json?.success === false) {
        throw new Error(json?.error || "AI request failed");
      }

      // Determine which provider actually responded
      const actualProvider: AIProvider = json.provider === "openai" 
        ? "anthropic" // OpenAI not supported, fallback shown
        : (json.provider || selectedProvider);

      const aiResponse: ExtendedChatMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content: json.message || "No response",
        timestamp: new Date().toISOString(),
        metadata: json.toolResults ? { tool_calls: json.toolResults } : undefined,
        provider: json.isDemo ? undefined : actualProvider,
        pendingActions: json.pendingActions,
      };

      setMessages(prev => [...prev, aiResponse]);
    } catch (err) {
      const aiResponse: ExtendedChatMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content: "Error: AI service unavailable. Check API keys.",
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, aiResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (action: string) => {
    const prompts: Record<string, string> = {
      priorities: "What are my top 3 priorities for today?",
      status: "Give me a status check across all arms. What's on track and what needs attention?",
      create_task: "I need to create a new task",
    };
    const prompt = prompts[action];
    if (prompt) {
      submitMessage(prompt);
    }
  };

  const handleSuggestion = (prompt: string) => {
    submitMessage(prompt);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div 
      className={cn("flex flex-col h-full relative", className)}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Drag Overlay */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-background/90 backdrop-blur-sm flex items-center justify-center"
          >
            <div className="border-2 border-dashed border-primary rounded-lg p-8 text-center">
              <Paperclip className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium">Drop files to analyze</p>
              <p className="text-xs text-muted-foreground">Images and PDFs supported</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!hasProvider && (
        <div className="mx-3 sm:mx-4 md:mx-6 mt-2 mb-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5" />
            <div>
              <div className="font-medium">AI not configured</div>
              <div className="text-[11px] text-amber-100/80">
                Missing provider keys: {missingProviders.join(", ")}. Add keys in Settings to enable real responses.
              </div>
            </div>
          </div>
        </div>
      )}

      {hasProvider && !aiStatus.serviceRole && (
        <div className="mx-3 sm:mx-4 md:mx-6 mt-2 mb-1 rounded-md border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-xs text-blue-200">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5" />
            <div>
              <div className="font-medium">Task tools disabled</div>
              <div className="text-[11px] text-blue-100/80">
                SUPABASE_SERVICE_ROLE_KEY is required for AI task creation and automation.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={ACCEPTED_FILE_TYPES.join(",")}
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          handleFilesAdded(files);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }}
        className="hidden"
      />

      {/* Messages */}
      <ScrollArea 
        className="flex-1 px-3 sm:px-4 md:px-6 py-3 sm:py-4" 
        ref={scrollAreaRef}
      >
        <div className="space-y-4 sm:space-y-6 max-w-3xl">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-2 sm:gap-4",
                message.role === "user" && "flex-row-reverse"
              )}
            >
              {/* Avatar - smaller on mobile */}
              <div className={cn(
                "w-6 h-6 sm:w-7 sm:h-7 rounded-sm flex items-center justify-center shrink-0 text-xs font-medium",
                message.role === "assistant" 
                  ? message.provider === "gemini"
                    ? "bg-[#4285F4] text-white"
                    : "bg-[#D97706] text-white"
                  : "bg-muted text-muted-foreground"
              )}>
                {message.role === "assistant" ? (
                  message.provider === "gemini" ? (
                    <Zap className="w-3 h-3" />
                  ) : (
                    <Sparkles className="w-3 h-3" />
                  )
                ) : (
                  "N"
                )}
              </div>
              
              {/* Content - wider on mobile */}
              <div className={cn(
                "flex-1 max-w-[90%] sm:max-w-[85%]",
                message.role === "user" && "text-right"
              )}>
                {/* Provider badge for assistant messages */}
                {message.role === "assistant" && message.provider && (
                  <div className="mb-1">
                    <span className={cn(
                      "text-[9px] font-medium tracking-wider uppercase px-1.5 py-0.5 rounded-sm",
                      message.provider === "gemini"
                        ? "bg-[#4285F4]/10 text-[#4285F4]"
                        : "bg-[#D97706]/10 text-[#D97706]"
                    )}>
                      {message.provider === "gemini" ? "GEMINI 3 PRO" : "OPUS 4.5"}
                    </span>
                  </div>
                )}
                
                {/* User message attachments */}
                {message.role === "user" && message.attachments && message.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2 justify-end">
                    {message.attachments.map((attachment, i) => (
                      <div
                        key={i}
                        className="bg-muted rounded-md overflow-hidden"
                      >
                        {attachment.preview ? (
                          <img
                            src={attachment.preview}
                            alt={attachment.name}
                            className="w-20 h-20 object-cover"
                          />
                        ) : (
                          <div className="w-20 h-20 flex flex-col items-center justify-center p-2">
                            <FileText className="w-6 h-6 text-muted-foreground mb-1" />
                            <span className="text-[8px] text-muted-foreground truncate w-full text-center">
                              {attachment.name}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className={cn(
                  "inline-block text-sm leading-relaxed whitespace-pre-wrap",
                  message.role === "assistant" 
                    ? "text-foreground" 
                    : "bg-muted px-4 py-2 rounded-sm text-left"
                )}>
                  {message.content}
                </div>

                {/* Pending Actions (for confirmation) */}
                {message.role === "assistant" && message.pendingActions && message.pendingActions.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {message.pendingActions.map((action) => (
                      <div
                        key={action.id}
                        className="bg-muted/50 border border-border rounded-md p-3"
                      >
                        <p className="text-xs font-medium mb-2">{action.description}</p>
                        <div className="flex gap-2 flex-wrap">
                          <button className="text-[10px] font-medium px-3 py-2 min-h-[36px] bg-primary text-primary-foreground rounded active:scale-95">
                            Approve
                          </button>
                          <button className="text-[10px] font-medium px-3 py-2 min-h-[36px] border border-border rounded hover:bg-muted active:scale-95">
                            Edit
                          </button>
                          <button className="text-[10px] font-medium px-3 py-2 min-h-[36px] text-muted-foreground hover:text-foreground active:scale-95">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-4">
              <div className={cn(
                "w-6 h-6 rounded-sm flex items-center justify-center",
                selectedProvider === "gemini" 
                  ? "bg-[#4285F4] text-white"
                  : "bg-[#D97706] text-white"
              )}>
                {selectedProvider === "gemini" ? (
                  <Zap className="w-3 h-3" />
                ) : (
                  <Sparkles className="w-3 h-3" />
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <span className={cn(
                    "w-1.5 h-1.5 rounded-full animate-pulse",
                    selectedProvider === "gemini" ? "bg-[#4285F4]" : "bg-[#D97706]"
                  )} />
                  <span className={cn(
                    "w-1.5 h-1.5 rounded-full animate-pulse [animation-delay:150ms]",
                    selectedProvider === "gemini" ? "bg-[#4285F4]" : "bg-[#D97706]"
                  )} />
                  <span className={cn(
                    "w-1.5 h-1.5 rounded-full animate-pulse [animation-delay:300ms]",
                    selectedProvider === "gemini" ? "bg-[#4285F4]" : "bg-[#D97706]"
                  )} />
                </div>
                <span className="text-xs text-muted-foreground">
                  {selectedProvider === "gemini" ? "Gemini 3 Pro" : "Opus 4.5"} thinking...
                </span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Suggestions - only show initially, compact on mobile */}
      {messages.length <= 2 && (
        <div className="px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 border-t border-border pt-3 sm:pt-4 shrink-0">
          <p className="text-[9px] sm:text-[10px] font-medium tracking-wider uppercase text-muted-foreground mb-2 sm:mb-3">
            Suggested
          </p>
          <div
            className="flex gap-2 overflow-x-auto pb-1 -mx-3 px-3 sm:-mx-4 sm:px-4 md:mx-0 md:px-0 md:flex-wrap scrollbar-hide"
            data-horizontal-scroll="true"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {suggestedPrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleSuggestion(prompt)}
                className="text-[11px] sm:text-xs text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap flex-shrink-0 min-h-[40px] sm:min-h-[44px] flex items-center active:scale-95 pr-2"
              >
                {prompt} →
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-border p-3 sm:p-4 shrink-0">
        {/* Quick Actions - horizontal scroll on mobile */}
        <div
          className="flex items-center gap-2 mb-2 sm:mb-3 overflow-x-auto pb-1 -mx-3 px-3 sm:-mx-4 sm:px-4 md:mx-0 md:px-0 scrollbar-hide"
          data-horizontal-scroll="true"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {quickActions.map((action) => (
            <button
              key={action.action}
              onClick={() => handleQuickAction(action.action)}
              className="text-[9px] sm:text-[10px] font-medium tracking-wider uppercase text-muted-foreground hover:text-foreground transition-colors px-2.5 sm:px-3 py-2 sm:py-2.5 min-h-[40px] sm:min-h-[44px] border border-border rounded-sm hover:border-foreground/30 whitespace-nowrap flex-shrink-0 active:scale-95"
            >
              {action.label}
            </button>
          ))}
        </div>

        {/* Attached Files Preview */}
        <AnimatePresence>
          {attachedFiles.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-3 flex flex-wrap gap-2"
            >
              {attachedFiles.map((attachment) => (
                <motion.div
                  key={attachment.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={spring.snappy}
                  className="relative group"
                >
                  {attachment.preview ? (
                    <div className="w-16 h-16 rounded-md overflow-hidden bg-muted">
                      <img
                        src={attachment.preview}
                        alt={attachment.file.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-md bg-muted flex flex-col items-center justify-center p-1">
                      <FileText className="w-5 h-5 text-muted-foreground mb-0.5" />
                      <span className="text-[7px] text-muted-foreground truncate w-full text-center px-1">
                        {attachment.file.name.split(".").pop()?.toUpperCase()}
                      </span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => handleFileRemove(attachment.id)}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          {/* Attach Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className={cn(
              "h-11 w-11 min-w-[44px] flex items-center justify-center rounded-md transition-colors active:scale-95",
              "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground",
              isLoading && "opacity-50 cursor-not-allowed"
            )}
            title="Attach files (images, PDFs)"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={attachedFiles.length > 0 ? "Add a message..." : "Enter command..."}
              className="h-11 text-sm bg-muted border-0 pr-12 lg:pr-36 font-mono"
              disabled={isLoading}
            />
            {/* Model Switcher - keep off mobile (Safari can report ~980px layout width); show on lg+ only */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden lg:flex items-center">
              <button
                type="button"
                onClick={() => setSelectedProvider(selectedProvider === "anthropic" ? "gemini" : "anthropic")}
                className={cn(
                  "flex items-center gap-1.5 px-2 py-1 rounded-sm text-[10px] font-medium tracking-wider uppercase transition-colors",
                  selectedProvider === "anthropic"
                    ? "bg-[#D97706]/10 text-[#D97706] hover:bg-[#D97706]/20"
                    : "bg-[#4285F4]/10 text-[#4285F4] hover:bg-[#4285F4]/20"
                )}
                title="Click to switch model"
              >
                {selectedProvider === "anthropic" ? (
                  <>
                    <Sparkles className="w-3 h-3" />
                    OPUS 4.5
                  </>
                ) : (
                  <>
                    <Zap className="w-3 h-3" />
                    GEMINI 3 PRO
                  </>
                )}
              </button>
            </div>
          </div>
          <Button 
            type="submit" 
            size="sm"
            className="h-11 w-11 min-w-[44px] p-0 md:w-auto md:px-4"
            disabled={(!input.trim() && attachedFiles.length === 0) || isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
