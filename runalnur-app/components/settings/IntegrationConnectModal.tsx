"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExternalLink, Check, AlertCircle, Loader2, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface IntegrationConnectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  integration: {
    id: string;
    name: string;
    description: string;
    envKey: string;
    docsUrl: string;
    instructions?: string[];
  };
  onConnect: (apiKey: string) => Promise<{ success: boolean; message: string }>;
}

export function IntegrationConnectModal({
  open,
  onOpenChange,
  integration,
  onConnect,
}: IntegrationConnectModalProps) {
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleConnect = async () => {
    if (!apiKey.trim()) return;
    
    setTesting(true);
    setResult(null);
    
    try {
      const res = await onConnect(apiKey.trim());
      setResult(res);
      
      // Auto-close on success after a delay
      if (res.success) {
        setTimeout(() => {
          handleClose();
        }, 2000);
      }
    } catch {
      setResult({ success: false, message: "Connection test failed" });
    }
    
    setTesting(false);
  };

  const handleClose = () => {
    setApiKey("");
    setResult(null);
    setShowKey(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Connect {integration.name}
          </DialogTitle>
          <DialogDescription>{integration.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Instructions */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              How to get your API key
            </p>
            <ol className="text-sm text-muted-foreground space-y-1.5 list-decimal list-inside">
              {integration.instructions?.map((instruction, i) => (
                <li key={i}>{instruction}</li>
              )) || (
                <>
                  <li>Go to {integration.name} settings</li>
                  <li>Navigate to API or Developer section</li>
                  <li>Generate or copy your API key</li>
                  <li>Paste it below</li>
                </>
              )}
            </ol>
            <a
              href={integration.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-foreground hover:underline mt-2"
            >
              View documentation
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* API Key Input */}
          <div>
            <label className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground block mb-2">
              API Key
            </label>
            <div className="relative">
              <Input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your API key..."
                className="h-10 text-sm pr-20 font-mono"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="p-1.5 hover:bg-muted rounded-sm transition-colors"
                >
                  {showKey ? (
                    <EyeOff className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <Eye className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Security notice */}
          {apiKey && (
            <div className="bg-muted/50 rounded-md p-3">
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[var(--live)]" />
                Your API key will be encrypted and stored securely on your account
              </p>
            </div>
          )}

          {/* Result */}
          {result && (
            <div
              className={cn(
                "flex items-start gap-2 text-sm p-3 rounded-md",
                result.success
                  ? "bg-[var(--live)]/10 text-[var(--live)]"
                  : "bg-[var(--error)]/10 text-[var(--error)]"
              )}
            >
              {result.success ? (
                <Check className="w-4 h-4 mt-0.5 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              )}
              <span>{result.message}</span>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleConnect} disabled={!apiKey.trim() || testing}>
            {testing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                TESTING...
              </>
            ) : (
              "TEST & CONNECT"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
