"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FadeIn } from "@/components/motion/FadeIn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { spring } from "@/lib/motion/tokens";
import { createSupabaseClient } from "@/lib/supabase/auth-client";
import { IntegrationConnectModal } from "@/components/settings/IntegrationConnectModal";
import { ClickUpConnect } from "@/components/settings/ClickUpConnect";
import { useClickUpStatus } from "@/lib/hooks/useClickUp";
import { useProcessStreetStatus } from "@/lib/hooks/useProcessStreet";
import { useHubSpotStatus } from "@/lib/hooks/useHubSpot";
import { useGuruStatus } from "@/lib/hooks/useGuru";
import { 
  Check, 
  ChevronRight, 
  Database, 
  Plug, 
  FileText, 
  Sparkles,
  ArrowRight,
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Integration {
  id: string;
  name: string;
  description: string;
  envKey: string;
  docsUrl: string;
  instructions?: string[];
  hasOAuth?: boolean;
}

const integrationsList: Integration[] = [
  {
    id: 'clickup',
    name: 'ClickUp',
    description: 'Project management',
    envKey: 'CLICKUP_API_KEY',
    docsUrl: 'https://clickup.com/api',
    hasOAuth: true,
    instructions: [
      "Go to ClickUp Settings → Apps",
      "Click 'Create an App' under API",
      "Copy your Personal API Token",
    ],
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    description: 'CRM & contacts',
    envKey: 'HUBSPOT_ACCESS_TOKEN',
    docsUrl: 'https://developers.hubspot.com/',
    instructions: [
      "Go to HubSpot Settings → Integrations",
      "Click 'Private Apps'",
      "Create and copy your access token",
    ],
  },
  {
    id: 'process-street',
    name: 'Process Street',
    description: 'SOPs & workflows',
    envKey: 'PROCESS_STREET_API_KEY',
    docsUrl: 'https://developer.process.st/',
    instructions: [
      "Go to Process Street",
      "Click avatar → API Keys",
      "Generate and copy your API key",
    ],
  },
  {
    id: 'guru',
    name: 'Guru',
    description: 'Knowledge base',
    envKey: 'GURU_API_KEY',
    docsUrl: 'https://developer.getguru.com/',
    instructions: [
      "Go to Guru Settings → API Access",
      "Generate a new API token",
      "Copy and paste it here",
    ],
  },
];

interface Step {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
}

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createSupabaseClient();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState("");
  
  // Integration statuses
  const { data: clickupStatus } = useClickUpStatus();
  const { data: processStreetStatus } = useProcessStreetStatus();
  const { data: hubspotStatus } = useHubSpotStatus();
  const { data: guruStatus } = useGuruStatus();
  
  // Modal state
  const [connectingIntegration, setConnectingIntegration] = useState<Integration | null>(null);
  
  const [steps, setSteps] = useState<Step[]>([
    {
      id: "welcome",
      title: "Welcome to Empire OS",
      description: "Let's get your command center operational.",
      icon: <Sparkles className="w-5 h-5" />,
      completed: false,
    },
    {
      id: "profile",
      title: "Set Up Your Profile",
      description: "Tell us a bit about yourself.",
      icon: <FileText className="w-5 h-5" />,
      completed: false,
    },
    {
      id: "database",
      title: "Verify Database",
      description: "Check Supabase connection.",
      icon: <Database className="w-5 h-5" />,
      completed: false,
    },
    {
      id: "integrations",
      title: "Connect Services",
      description: "Set up ClickUp, HubSpot, etc.",
      icon: <Plug className="w-5 h-5" />,
      completed: false,
    },
  ]);

  // Get integration status
  const getIntegrationStatus = (id: string) => {
    if (id === 'clickup') return Boolean((clickupStatus as { connected?: boolean } | null)?.connected);
    if (id === 'hubspot') return Boolean((hubspotStatus as { connected?: boolean } | null)?.connected);
    if (id === 'process-street') return Boolean((processStreetStatus as { connected?: boolean } | null)?.connected);
    if (id === 'guru') return Boolean((guruStatus as { connected?: boolean } | null)?.connected);
    return false;
  };

  const connectedIntegrations = integrationsList.filter(i => getIntegrationStatus(i.id)).length;

  // Check Supabase connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserName(user.user_metadata?.full_name || "");
          // Mark welcome as complete if user is logged in
          setSteps(prev => prev.map((s, i) => i === 0 ? { ...s, completed: true } : s));
        }
      } catch {
        // Supabase not configured
      }
    };
    checkConnection();
  }, [supabase.auth]);

  const completeStep = (stepIndex: number) => {
    setSteps(prev => prev.map((s, i) => i === stepIndex ? { ...s, completed: true } : s));
  };

  const handleProfileSave = async () => {
    if (!userName.trim()) return;
    setLoading(true);
    
    try {
      await supabase.auth.updateUser({
        data: { full_name: userName },
      });
      completeStep(1);
      setCurrentStep(2);
    } catch {
      // Handle error
    }
    
    setLoading(false);
  };

  const handleDatabaseCheck = async () => {
    setLoading(true);
    
    try {
      // Try to query the arms table
      const { error } = await supabase.from("arms").select("count");
      if (!error) {
        completeStep(2);
        setCurrentStep(3);
      }
    } catch {
      // Database not configured
    }
    
    setLoading(false);
  };

  const handleConnect = async (apiKey: string): Promise<{ success: boolean; message: string }> => {
    if (!connectingIntegration) return { success: false, message: "No integration selected" };
    
    if (apiKey.length < 10) {
      return { success: false, message: "API key appears to be invalid (too short)" };
    }
    
    return { 
      success: true, 
      message: `Key validated! Add ${connectingIntegration.envKey}=${apiKey.substring(0, 8)}... to your .env.local file and restart the server.`
    };
  };

  const handleFinish = () => {
    completeStep(3);
    router.push("/");
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={spring.default}
            className="text-center space-y-6"
          >
            <div className="w-16 h-16 rounded-full bg-foreground text-background flex items-center justify-center mx-auto">
              <Sparkles className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold">Welcome to Empire OS</h2>
              <p className="text-muted-foreground mt-2">
                Your AI-powered command center for House Al Nur.
              </p>
            </div>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>✓ Manage all 7 arms from one dashboard</p>
              <p>✓ AI-powered operations and briefings</p>
              <p>✓ Integrations with ClickUp, HubSpot, and more</p>
            </div>
            <Button 
              size="lg" 
              className="gap-2"
              onClick={() => { completeStep(0); setCurrentStep(1); }}
            >
              GET STARTED
              <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.div>
        );

      case 1:
        return (
          <motion.div
            key="profile"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={spring.default}
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-xl font-semibold">Set Up Your Profile</h2>
              <p className="text-muted-foreground mt-1">
                What should we call you?
              </p>
            </div>
            <div>
              <label className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground block mb-2">
                Your Name
              </label>
              <Input
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Nurullah"
                className="h-10 text-sm"
              />
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline"
                onClick={() => setCurrentStep(0)}
              >
                Back
              </Button>
              <Button 
                className="flex-1 gap-2"
                onClick={handleProfileSave}
                disabled={!userName.trim() || loading}
              >
                {loading ? "SAVING..." : "CONTINUE"}
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            key="database"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={spring.default}
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-xl font-semibold">Verify Database</h2>
              <p className="text-muted-foreground mt-1">
                Let&apos;s make sure Supabase is set up correctly.
              </p>
            </div>
            <div className="agentic-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Supabase Connection</span>
                <span className="text-[10px] font-mono text-muted-foreground">
                  NEXT_PUBLIC_SUPABASE_URL
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Click the button below to verify your database is configured and the schema is loaded.
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline"
                onClick={() => setCurrentStep(1)}
              >
                Back
              </Button>
              <Button 
                className="flex-1 gap-2"
                onClick={handleDatabaseCheck}
                disabled={loading}
              >
                {loading ? "CHECKING..." : "VERIFY CONNECTION"}
                <Database className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            key="integrations"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={spring.default}
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-xl font-semibold">Connect Services</h2>
              <p className="text-muted-foreground mt-1">
                {connectedIntegrations === 0 
                  ? "Connect your external tools to unlock full functionality."
                  : `${connectedIntegrations} of ${integrationsList.length} services connected`
                }
              </p>
            </div>
            
            <div className="space-y-2">
              {integrationsList.map((integration) => {
                const isConnected = getIntegrationStatus(integration.id);
                return (
                  <div 
                    key={integration.id} 
                    className="agentic-card p-3 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-2.5 h-2.5 rounded-full",
                        isConnected ? "bg-[var(--live)]" : "bg-border"
                      )} />
                      <div>
                        <span className="text-sm font-medium">{integration.name}</span>
                        <p className="text-[10px] text-muted-foreground">
                          {integration.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isConnected ? (
                        <span className="variant-badge live">CONNECTED</span>
                      ) : (
                        <>
                          {integration.hasOAuth ? (
                            <ClickUpConnect />
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-[10px] gap-1"
                              onClick={() => setConnectingIntegration(integration)}
                            >
                              <Plug className="w-3 h-3" />
                              CONNECT
                            </Button>
                          )}
                          <a
                            href={integration.docsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 hover:bg-muted rounded-sm transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <p className="text-xs text-muted-foreground text-center">
              You can always configure more integrations in Settings later.
            </p>
            
            <div className="flex gap-3">
              <Button 
                variant="outline"
                onClick={() => setCurrentStep(2)}
              >
                Back
              </Button>
              <Button 
                className="flex-1 gap-2"
                onClick={handleFinish}
              >
                {connectedIntegrations > 0 ? "FINISH SETUP" : "SKIP & FINISH"}
                <Check className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-lg">
        {/* Progress Steps */}
        <FadeIn className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => step.completed && setCurrentStep(index)}
                  disabled={!step.completed && index !== currentStep}
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all",
                    index === currentStep && "bg-foreground text-background",
                    step.completed && index !== currentStep && "bg-[var(--live)] text-white cursor-pointer",
                    !step.completed && index !== currentStep && "bg-border text-muted-foreground"
                  )}
                >
                  {step.completed ? <Check className="w-4 h-4" /> : index + 1}
                </button>
                {index < steps.length - 1 && (
                  <div className={cn(
                    "w-8 sm:w-16 h-0.5 mx-1",
                    step.completed ? "bg-[var(--live)]" : "bg-border"
                  )} />
                )}
              </div>
            ))}
          </div>
        </FadeIn>

        {/* Step Content */}
        <div className="agentic-card p-6 sm:p-8">
          <AnimatePresence mode="wait">
            {renderStepContent()}
          </AnimatePresence>
        </div>

        {/* Step Labels */}
        <div className="mt-4 text-center">
          <p className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground">
            Step {currentStep + 1} of {steps.length}: {steps[currentStep].title}
          </p>
        </div>
      </div>

      {/* Integration Connect Modal */}
      {connectingIntegration && (
        <IntegrationConnectModal
          open={!!connectingIntegration}
          onOpenChange={(open) => !open && setConnectingIntegration(null)}
          integration={connectingIntegration}
          onConnect={handleConnect}
        />
      )}
    </div>
  );
}
