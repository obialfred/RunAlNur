"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExternalLink, Check, RefreshCw, Plug, Settings2, FolderTree, Loader2, Palette, Download, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { ClickUpConnect } from "@/components/settings/ClickUpConnect";
import { IntegrationConnectModal } from "@/components/settings/IntegrationConnectModal";
import { ThemeToggle } from "@/components/settings/ThemeToggle";
import { InstallButton } from "@/components/pwa/InstallPrompt";
import { useInstallGuide } from "@/components/pwa/InstallGuide";
import { useClickUpStatus } from "@/lib/hooks/useClickUp";
import { useClickUpHierarchy } from "@/lib/hooks/useClickUpHierarchy";
import { useApi } from "@/lib/hooks/useApi";
import { FadeIn } from "@/components/motion/FadeIn";
import { Stagger } from "@/components/motion/Stagger";
import { SlideIn } from "@/components/motion/SlideIn";
import { useProcessStreetStatus } from "@/lib/hooks/useProcessStreet";
import { useHubSpotStatus } from "@/lib/hooks/useHubSpot";
import { useGuruStatus } from "@/lib/hooks/useGuru";
import { createSupabaseClient } from "@/lib/supabase/auth-client";
import Link from "next/link";
import { ARMS } from "@/lib/constants";

// Hook to get AI provider status
function useAIProviderStatus(provider: "anthropic" | "gemini" | "openai") {
  const [data, setData] = useState<{
    connected: boolean;
    error?: string;
    metadata?: Record<string, unknown>;
    connectedAt?: string | null;
  }>({ connected: false });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/integrations/${provider}`);
      const json = await response.json();
      setData({
        connected: Boolean(json.success && json.connected),
        error: json.error,
        metadata: json.metadata,
        connectedAt: json.connectedAt,
      });
    } catch {
      setData({ connected: false, error: "Failed to check status" });
    } finally {
      setLoading(false);
    }
  }, [provider]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, loading, refresh };
}

interface Integration {
  id: string;
  name: string;
  description: string;
  status: string;
  envKey: string;
  docsUrl: string;
  instructions?: string[];
  hasOAuth?: boolean;
}

const integrations: Integration[] = [
  {
    id: 'supabase',
    name: 'Supabase',
    description: 'Database and authentication',
    status: 'pending',
    envKey: 'NEXT_PUBLIC_SUPABASE_URL',
    docsUrl: 'https://supabase.com/docs',
    instructions: [
      "Create a project at supabase.com",
      "Go to Project Settings → API",
      "Copy your Project URL and anon key",
      "Add both to your .env.local file",
    ],
  },
  {
    id: 'clickup',
    name: 'ClickUp',
    description: 'Project management and tasks',
    status: 'pending',
    envKey: 'CLICKUP_API_KEY',
    docsUrl: 'https://clickup.com/api',
    hasOAuth: true,
    instructions: [
      "Go to ClickUp Settings → Apps",
      "Click 'Create an App' under API",
      "Copy your Personal API Token",
      "Or use OAuth by clicking Connect below",
    ],
  },
  {
    id: 'process-street',
    name: 'Process Street',
    description: 'SOPs and workflows',
    status: 'pending',
    envKey: 'PROCESS_STREET_API_KEY',
    docsUrl: 'https://developer.process.st/',
    instructions: [
      "Go to Process Street",
      "Click your avatar → API Keys",
      "Generate a new API key",
      "Copy and paste it below",
    ],
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    description: 'CRM and contacts',
    status: 'pending',
    envKey: 'HUBSPOT_ACCESS_TOKEN',
    docsUrl: 'https://developers.hubspot.com/',
    instructions: [
      "Go to HubSpot Settings → Integrations",
      "Click 'Private Apps'",
      "Create a new app or select existing",
      "Copy your access token",
    ],
  },
  {
    id: 'guru',
    name: 'Guru',
    description: 'Knowledge base',
    status: 'pending',
    envKey: 'GURU_API_KEY',
    docsUrl: 'https://developer.getguru.com/',
    instructions: [
      "Go to Guru Settings → API Access",
      "Generate a new API token",
      "Copy the token",
      "Paste it below",
    ],
  },
  {
    id: 'anthropic',
    name: 'Claude (Anthropic)',
    description: 'Claude AI models for reasoning and analysis',
    status: 'pending',
    envKey: 'ANTHROPIC_API_KEY',
    docsUrl: 'https://console.anthropic.com/settings/keys',
    instructions: [
      "Go to console.anthropic.com",
      "Navigate to Settings → API Keys",
      "Create a new API key",
      "Paste it below to connect",
    ],
  },
  {
    id: 'gemini',
    name: 'Gemini (Google AI)',
    description: 'Google AI models for multimodal tasks',
    status: 'pending',
    envKey: 'GOOGLE_AI_API_KEY',
    docsUrl: 'https://aistudio.google.com/app/apikey',
    instructions: [
      "Go to aistudio.google.com/app/apikey",
      "Create or select a project",
      "Create an API key",
      "Paste it below to connect",
    ],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT models for text generation',
    status: 'pending',
    envKey: 'OPENAI_API_KEY',
    docsUrl: 'https://platform.openai.com/api-keys',
    instructions: [
      "Go to platform.openai.com/api-keys",
      "Create a new secret key",
      "Copy and paste it below",
    ],
  },
];

export default function SettingsPage() {
  const supabase = createSupabaseClient();
  const { showGuide, setShowGuide, isInstalled, InstallGuideComponent } = useInstallGuide();
  const { data: clickupStatus, refresh: refreshClickup } = useClickUpStatus();
  const { data: clickupHierarchy } = useClickUpHierarchy();
  const clickupConnected = Boolean((clickupStatus as { connected?: boolean } | null)?.connected);
  const { data: clickupMappings, refresh: refreshMappings } = useApi<Array<{ arm_id: string; list_id: string; list_name?: string | null }>>(
    clickupConnected ? "/api/clickup/mappings" : null,
    [],
    { enabled: clickupConnected }
  );
  const { data: processStreetStatus, refresh: refreshPS } = useProcessStreetStatus();
  const { data: hubspotStatus, refresh: refreshHubspot } = useHubSpotStatus();
  const { data: guruStatus, refresh: refreshGuru } = useGuruStatus();
  const { data: anthropicStatus, refresh: refreshAnthropic } = useAIProviderStatus("anthropic");
  const { data: geminiStatus, refresh: refreshGemini } = useAIProviderStatus("gemini");
  const { data: openaiStatus, refresh: refreshOpenAI } = useAIProviderStatus("openai");
  const processStreetConnected = Boolean((processStreetStatus as { connected?: boolean } | null)?.connected);
  const hubspotConnected = Boolean((hubspotStatus as { connected?: boolean } | null)?.connected);
  const guruConnected = Boolean((guruStatus as { connected?: boolean } | null)?.connected);
  const anthropicConnected = Boolean(anthropicStatus?.connected);
  const geminiConnected = Boolean(geminiStatus?.connected);
  const openaiConnected = Boolean(openaiStatus?.connected);

  // Integration modal state
  const [connectingIntegration, setConnectingIntegration] = useState<Integration | null>(null);

  // Integration test state
  const [testingIntegration, setTestingIntegration] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string }>>({});

  // Map integration IDs to API provider names
  const getProviderName = (integrationId: string): string => {
    const map: Record<string, string> = {
      'clickup': 'clickup',
      'process-street': 'process_street',
      'hubspot': 'hubspot',
      'guru': 'guru',
      'openai': 'openai',
      'anthropic': 'anthropic',
      'gemini': 'gemini',
    };
    return map[integrationId] || integrationId;
  };

  // Test connection function - uses new per-user API
  const testConnection = async (integrationId: string) => {
    setTestingIntegration(integrationId);
    try {
      const provider = getProviderName(integrationId);
      const response = await fetch(`/api/integrations/${provider}/test`, {
        method: 'POST',
      });
      const data = await response.json();
      setTestResults(prev => ({
        ...prev,
        [integrationId]: {
          success: data.success && data.connected,
          message: data.connected 
            ? 'Connected successfully' 
            : (data.error || 'Not connected'),
        }
      }));
      
      // Refresh status
      if (integrationId === 'clickup') refreshClickup();
      if (integrationId === 'process-street') refreshPS();
      if (integrationId === 'hubspot') refreshHubspot();
      if (integrationId === 'guru') refreshGuru();
      if (integrationId === 'anthropic') refreshAnthropic();
      if (integrationId === 'gemini') refreshGemini();
      if (integrationId === 'openai') refreshOpenAI();
    } catch {
      setTestResults(prev => ({
        ...prev,
        [integrationId]: {
          success: false,
          message: 'Connection test failed',
        }
      }));
    }
    setTestingIntegration(null);
  };

  // Handle connect from modal - saves API key securely to database
  const handleConnect = async (apiKey: string): Promise<{ success: boolean; message: string }> => {
    if (!connectingIntegration) return { success: false, message: "No integration selected" };
    
    // Basic validation
    if (apiKey.length < 10) {
      return { success: false, message: "API key appears to be invalid (too short)" };
    }

    const provider = getProviderName(connectingIntegration.id);
    
    try {
      const response = await fetch(`/api/integrations/${provider}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: apiKey }),
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        return { 
          success: false, 
          message: data.error || data.details || 'Connection failed' 
        };
      }

      // Refresh status after successful connect
      if (connectingIntegration.id === 'clickup') refreshClickup();
      if (connectingIntegration.id === 'process-street') refreshPS();
      if (connectingIntegration.id === 'hubspot') refreshHubspot();
      if (connectingIntegration.id === 'guru') refreshGuru();
      if (connectingIntegration.id === 'anthropic') refreshAnthropic();
      if (connectingIntegration.id === 'gemini') refreshGemini();
      if (connectingIntegration.id === 'openai') refreshOpenAI();

      return { 
        success: true, 
        message: `${connectingIntegration.name} connected successfully! Your credentials are stored securely.`
      };
    } catch (err) {
      return { 
        success: false, 
        message: err instanceof Error ? err.message : 'Connection failed'
      };
    }
  };

  // Handle disconnect
  const handleDisconnect = async (integrationId: string) => {
    const provider = getProviderName(integrationId);
    try {
      const response = await fetch(`/api/integrations/${provider}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        // Refresh status
        if (integrationId === 'clickup') refreshClickup();
        if (integrationId === 'process-street') refreshPS();
        if (integrationId === 'hubspot') refreshHubspot();
        if (integrationId === 'guru') refreshGuru();
        if (integrationId === 'anthropic') refreshAnthropic();
        if (integrationId === 'gemini') refreshGemini();
        if (integrationId === 'openai') refreshOpenAI();
      }
    } catch (err) {
      console.error('Failed to disconnect:', err);
    }
  };

  // Profile state
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("");

  // Load profile on mount
  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email || "");
        setName(user.user_metadata?.full_name || "");
        setTitle(user.user_metadata?.title || "");
      }
      setProfileLoading(false);
    };
    loadProfile();
  }, [supabase.auth]);

  // Save profile
  const handleSaveProfile = async () => {
    setProfileSaving(true);
    setProfileError(null);
    setProfileSaved(false);

    const { error } = await supabase.auth.updateUser({
      data: {
        full_name: name,
        title: title,
      },
    });

    if (error) {
      setProfileError(error.message);
    } else {
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    }
    setProfileSaving(false);
  };

  // Check Supabase connection
  const [supabaseConnected, setSupabaseConnected] = useState(false);
  useEffect(() => {
    const check = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        setSupabaseConnected(!!data.session || !!process.env.NEXT_PUBLIC_SUPABASE_URL);
      } catch {
        setSupabaseConnected(false);
      }
    };
    check();
  }, [supabase.auth]);

  const integrationsWithStatus = useMemo(() => {
    return integrations.map((integration) => {
      if (integration.id === "supabase") {
        return {
          ...integration,
          status: supabaseConnected ? "connected" : "pending",
        };
      }
      if (integration.id === "clickup") {
        return {
          ...integration,
          status: clickupConnected ? "connected" : "pending",
        };
      }
      if (integration.id === "process-street") {
        return {
          ...integration,
          status: processStreetConnected ? "connected" : "pending",
        };
      }
      if (integration.id === "hubspot") {
        return {
          ...integration,
          status: hubspotConnected ? "connected" : "pending",
        };
      }
      if (integration.id === "guru") {
        return {
          ...integration,
          status: guruConnected ? "connected" : "pending",
        };
      }
      if (integration.id === "anthropic") {
        return {
          ...integration,
          status: anthropicConnected ? "connected" : "pending",
        };
      }
      if (integration.id === "gemini") {
        return {
          ...integration,
          status: geminiConnected ? "connected" : "pending",
        };
      }
      if (integration.id === "openai") {
        return {
          ...integration,
          status: openaiConnected ? "connected" : "pending",
        };
      }
      return integration;
    });
  }, [
    clickupConnected,
    processStreetConnected,
    hubspotConnected,
    guruConnected,
    anthropicConnected,
    geminiConnected,
    openaiConnected,
    supabaseConnected,
  ]);

  const connectedCount = integrationsWithStatus.filter(i => i.status === "connected").length;

  // ClickUp Setup state
  const [setupLoading, setSetupLoading] = useState(false);
  const [setupPreview, setSetupPreview] = useState<{
    workspace?: { id: string; name: string };
    spec?: { spaces: string[]; totalFolders: number; totalLists: number; totalTasks: number };
    preview?: {
      wouldCreate: { folders: string[]; lists: string[]; tasks: number };
      alreadyExists: { folders: string[]; lists: string[] };
      missingSpaces: string[];
    };
  } | null>(null);
  const [setupRunning, setSetupRunning] = useState(false);
  const [setupResult, setSetupResult] = useState<{
    success: boolean;
    created?: { folders: number; lists: number; tasks: number };
    skipped?: { folders: number; lists: number; tasks: number };
    errors?: string[];
    duration?: number;
  } | null>(null);

  // Preview ClickUp setup
  const previewClickUpSetup = async () => {
    setSetupLoading(true);
    setSetupResult(null);
    try {
      const res = await fetch('/api/clickup/setup');
      const data = await res.json();
      if (data.success) {
        setSetupPreview(data);
      } else {
        setSetupPreview(null);
        alert(data.error || 'Failed to preview setup');
      }
    } catch (err) {
      console.error('Preview error:', err);
    }
    setSetupLoading(false);
  };

  // Execute ClickUp setup
  const executeClickUpSetup = async () => {
    if (!confirm('This will create folders, lists, and tasks in your ClickUp workspace. Continue?')) return;
    
    setSetupRunning(true);
    setSetupResult(null);
    try {
      const res = await fetch('/api/clickup/setup', { method: 'POST' });
      const data = await res.json();
      setSetupResult(data.success ? data.result : { success: false, errors: [data.error] });
    } catch (err) {
      setSetupResult({ success: false, errors: [String(err)] });
    }
    setSetupRunning(false);
  };

  // ClickUp task sync mappings (Arm -> ClickUp List)
  const allClickUpLists = useMemo(() => {
    const lists: Array<{ id: string; name: string; label: string }> = [];
    if (!clickupHierarchy?.spaces) return lists;
    for (const space of clickupHierarchy.spaces) {
      for (const folder of space.folders) {
        for (const list of folder.lists) {
          lists.push({
            id: list.id,
            name: list.name,
            label: `${space.name} / ${folder.name} / ${list.name}`,
          });
        }
      }
    }
    return lists.sort((a, b) => a.label.localeCompare(b.label));
  }, [clickupHierarchy]);

  const mappingByArm = useMemo(() => {
    const map = new Map<string, { list_id: string; list_name?: string | null }>();
    for (const m of clickupMappings || []) {
      map.set(m.arm_id, { list_id: m.list_id, list_name: m.list_name });
    }
    return map;
  }, [clickupMappings]);

  const setArmMapping = async (armId: string, listId: string) => {
    const list = allClickUpLists.find(l => l.id === listId);
    await fetch("/api/clickup/mappings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        arm_id: armId,
        list_id: listId,
        list_name: list?.name || null,
      }),
    });
    await refreshMappings();
  };

  const clearArmMapping = async (armId: string) => {
    await fetch(`/api/clickup/mappings?arm_id=${encodeURIComponent(armId)}`, {
      method: "DELETE",
    });
    await refreshMappings();
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-3xl">
      {/* Header */}
      <FadeIn>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Settings</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Configure integrations and preferences
            </p>
          </div>
          <Link href="/onboarding" className="w-full sm:w-auto shrink-0">
            <Button variant="outline" size="sm" className="gap-2 text-xs w-full sm:w-auto h-11 sm:h-9">
              <Settings2 className="w-4 h-4" />
              SETUP WIZARD
            </Button>
          </Link>
        </div>
      </FadeIn>

      <Tabs defaultValue="integrations" className="w-full">
        <TabsList className="bg-transparent border-b border-border rounded-none w-full justify-start gap-4 sm:gap-6 p-0 h-auto mb-6 overflow-x-auto scrollbar-hide px-3 sm:px-0">
          <TabsTrigger 
            value="integrations" 
            className="text-xs font-medium tracking-wider uppercase data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-foreground rounded-none px-2 py-3 whitespace-nowrap flex-shrink-0 min-h-[44px] focus-visible:outline-none focus-visible:ring-0"
          >
            Integrations ({connectedCount}/{integrations.length})
          </TabsTrigger>
          <TabsTrigger 
            value="profile" 
            className="text-xs font-medium tracking-wider uppercase data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-foreground rounded-none px-2 py-3 whitespace-nowrap flex-shrink-0 min-h-[44px] focus-visible:outline-none focus-visible:ring-0"
          >
            Profile
          </TabsTrigger>
          <TabsTrigger 
            value="appearance" 
            className="text-xs font-medium tracking-wider uppercase data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-foreground rounded-none px-2 py-3 whitespace-nowrap flex-shrink-0 min-h-[44px] focus-visible:outline-none focus-visible:ring-0"
          >
            Appearance
          </TabsTrigger>
          <TabsTrigger 
            value="app" 
            className="text-xs font-medium tracking-wider uppercase data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-foreground rounded-none px-2 py-3 whitespace-nowrap flex-shrink-0 min-h-[44px] focus-visible:outline-none focus-visible:ring-0"
          >
            App
          </TabsTrigger>
        </TabsList>

        <TabsContent value="integrations">
          {/* Status Summary */}
          <FadeIn className="agentic-card p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  connectedCount === integrations.length ? "bg-[var(--live)]/10" : "bg-muted"
                )}>
                  <Plug className={cn(
                    "w-5 h-5",
                    connectedCount === integrations.length ? "text-[var(--live)]" : "text-muted-foreground"
                  )} />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {connectedCount === integrations.length 
                      ? "All integrations connected!" 
                      : `${connectedCount} of ${integrations.length} integrations connected`
                    }
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Click CONNECT to configure each service
                  </p>
                </div>
              </div>
            </div>
          </FadeIn>

          {/* Integrations List */}
          <Stagger className="space-y-3">
            {integrationsWithStatus.map((integration) => (
              <SlideIn key={integration.id} className="agentic-card p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
                  <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0">
                    <div className={cn(
                      "w-3 h-3 rounded-full shrink-0 mt-1 sm:mt-0",
                      integration.status === 'connected' ? "bg-[var(--live)]" : "bg-border"
                    )} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-sm">{integration.name}</span>
                        <span className={cn(
                          "variant-badge",
                          integration.status === 'connected' ? "live" : "draft"
                        )}>
                          {integration.status === 'connected' ? 'CONNECTED' : 'PENDING'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {integration.description}
                      </p>
                      {integration.id === "clickup" && clickupConnected && (
                        <div className="mt-1 space-y-0.5">
                          <p className="text-[10px] text-muted-foreground">
                            {(() => {
                              const meta = (clickupStatus as { metadata?: Record<string, unknown> | null } | null)
                                ?.metadata;
                              const email = typeof meta?.clickup_email === "string" ? meta.clickup_email : null;
                              const username =
                                typeof meta?.clickup_username === "string" ? meta.clickup_username : null;
                              const workspaces = (clickupStatus as { workspaces?: number } | null)?.workspaces;
                              const parts = [
                                workspaces ? `${workspaces} workspace${workspaces === 1 ? "" : "s"}` : null,
                                username ? `@${username}` : null,
                                email ? email : null,
                              ].filter(Boolean);
                              return parts.length ? parts.join(" • ") : "Connected";
                            })()}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {(() => {
                              const connectedAt = (clickupStatus as { connectedAt?: string | null } | null)?.connectedAt;
                              const scopes = (clickupStatus as { scopes?: string[] | null } | null)?.scopes;
                              const parts = [
                                connectedAt ? `Connected ${new Date(connectedAt).toLocaleString()}` : null,
                                scopes?.length ? `Scopes: ${scopes.join(", ")}` : null,
                              ].filter(Boolean);
                              return parts.join(" • ");
                            })()}
                          </p>
                        </div>
                      )}
                      {integration.id === "guru" && guruConnected && (
                        <div className="mt-1 space-y-0.5">
                          <p className="text-[10px] text-muted-foreground">
                            {(() => {
                              const collectionsCount = (guruStatus as { collectionsCount?: number } | null)
                                ?.collectionsCount;
                              return typeof collectionsCount === "number"
                                ? `${collectionsCount} collection${collectionsCount === 1 ? "" : "s"}`
                                : "Connected";
                            })()}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {(() => {
                              const connectedAt = (guruStatus as { connectedAt?: string | null } | null)?.connectedAt;
                              const scopes = (guruStatus as { scopes?: string[] | null } | null)?.scopes;
                              const parts = [
                                connectedAt ? `Connected ${new Date(connectedAt).toLocaleString()}` : null,
                                scopes?.length ? `Scopes: ${scopes.join(", ")}` : null,
                              ].filter(Boolean);
                              return parts.join(" • ");
                            })()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Actions - wrap on mobile */}
                  <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-0 sm:shrink-0">
                    {/* Connect button */}
                    {integration.status !== 'connected' && (
                      integration.hasOAuth ? (
                        <ClickUpConnect />
                      ) : (
                        <Button
                          variant="default"
                          size="sm"
                          className="text-[10px] h-9 sm:h-7 px-3 gap-1"
                          onClick={() => setConnectingIntegration(integration)}
                        >
                          <Plug className="w-3 h-3" />
                          CONNECT
                        </Button>
                      )
                    )}
                    
                    {/* Test button - show for all except Supabase */}
                    {integration.id !== 'supabase' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-[10px] h-9 sm:h-7 px-3 sm:px-2"
                        onClick={() => testConnection(integration.id)}
                        disabled={testingIntegration === integration.id}
                      >
                        {testingIntegration === integration.id ? (
                          <>
                            <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                            TESTING...
                          </>
                        ) : (
                          'TEST'
                        )}
                      </Button>
                    )}

                    {/* Disconnect button - show for connected integrations (except Supabase) */}
                    {integration.status === 'connected' && integration.id !== 'supabase' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[10px] h-9 sm:h-7 px-3 sm:px-2 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDisconnect(integration.id)}
                      >
                        DISCONNECT
                      </Button>
                    )}
                    
                    {/* Docs link - hide label on mobile */}
                    <a 
                      href={integration.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 px-2 h-9 sm:h-7"
                    >
                      <span className="hidden sm:inline">DOCS</span>
                      <ExternalLink className="w-4 h-4 sm:w-3 sm:h-3" />
                    </a>
                  </div>
                </div>
                
                {/* Test results */}
                {testResults[integration.id] && (
                  <div className={cn(
                    "mt-3 text-xs px-3 py-2 rounded",
                    testResults[integration.id].success 
                      ? "bg-[var(--live)]/10 text-[var(--live)]" 
                      : "bg-[var(--error)]/10 text-[var(--error)]"
                  )}>
                    <div className="flex items-center gap-2">
                      {testResults[integration.id].success ? (
                        <Check className="w-3 h-3" />
                      ) : null}
                      {testResults[integration.id].message}
                    </div>
                  </div>
                )}
              </SlideIn>
            ))}
          </Stagger>

          {/* ClickUp Structure Setup */}
          {clickupConnected && (
            <FadeIn className="mt-6">
              <div className="agentic-card">
                <div className="agentic-card-header flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FolderTree className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <h3 className="text-section">ClickUp Structure Setup</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Automatically create House Al Nūr folders, lists, and seed tasks
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-[10px] h-7 px-3"
                    onClick={previewClickUpSetup}
                    disabled={setupLoading}
                  >
                    {setupLoading ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        CHECKING...
                      </>
                    ) : (
                      'PREVIEW'
                    )}
                  </Button>
                </div>

                {/* Preview Results */}
                {setupPreview && (
                  <div className="agentic-card-content border-t border-border">
                    <div className="space-y-4">
                      {/* Workspace Info */}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Workspace:</span>
                        <span className="font-medium">{setupPreview.workspace?.name}</span>
                      </div>

                      {/* Spec Summary */}
                      <div className="grid grid-cols-4 gap-2 text-center">
                        <div className="p-2 rounded bg-muted/50">
                          <div className="text-lg font-semibold">{setupPreview.spec?.spaces.length}</div>
                          <div className="text-[10px] text-muted-foreground uppercase">Spaces</div>
                        </div>
                        <div className="p-2 rounded bg-muted/50">
                          <div className="text-lg font-semibold">{setupPreview.spec?.totalFolders}</div>
                          <div className="text-[10px] text-muted-foreground uppercase">Folders</div>
                        </div>
                        <div className="p-2 rounded bg-muted/50">
                          <div className="text-lg font-semibold">{setupPreview.spec?.totalLists}</div>
                          <div className="text-[10px] text-muted-foreground uppercase">Lists</div>
                        </div>
                        <div className="p-2 rounded bg-muted/50">
                          <div className="text-lg font-semibold">{setupPreview.spec?.totalTasks}</div>
                          <div className="text-[10px] text-muted-foreground uppercase">Tasks</div>
                        </div>
                      </div>

                      {/* Missing Spaces Warning */}
                      {setupPreview.preview?.missingSpaces && setupPreview.preview.missingSpaces.length > 0 && (
                        <div className="p-3 rounded bg-[var(--error)]/10 border border-[var(--error)]/20">
                          <p className="text-xs text-[var(--error)] font-medium">Missing Spaces (create in ClickUp first):</p>
                          <ul className="mt-1 text-xs text-[var(--error)]/80">
                            {setupPreview.preview.missingSpaces.map(s => (
                              <li key={s}>• {s}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Would Create */}
                      {setupPreview.preview && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium">Would Create:</span>
                            <span className="text-xs text-muted-foreground">
                              {setupPreview.preview.wouldCreate.folders.length} folders, {setupPreview.preview.wouldCreate.lists.length} lists, ~{setupPreview.preview.wouldCreate.tasks} tasks
                            </span>
                          </div>
                          {setupPreview.preview.wouldCreate.folders.length > 0 && (
                            <div className="max-h-32 overflow-y-auto text-xs text-muted-foreground bg-muted/30 rounded p-2">
                              {setupPreview.preview.wouldCreate.folders.slice(0, 10).map(f => (
                                <div key={f} className="py-0.5">+ {f}</div>
                              ))}
                              {setupPreview.preview.wouldCreate.folders.length > 10 && (
                                <div className="py-0.5 text-muted-foreground/60">...and {setupPreview.preview.wouldCreate.folders.length - 10} more</div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Already Exists */}
                      {setupPreview.preview && setupPreview.preview.alreadyExists.folders.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          <span className="font-medium text-[var(--live)]">Already exists:</span> {setupPreview.preview.alreadyExists.folders.length} folders, {setupPreview.preview.alreadyExists.lists.length} lists
                        </div>
                      )}

                      {/* Execute Button */}
                      <Button
                        className="w-full text-xs"
                        onClick={executeClickUpSetup}
                        disabled={setupRunning || (setupPreview.preview?.missingSpaces?.length || 0) > 0}
                      >
                        {setupRunning ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            CREATING STRUCTURE...
                          </>
                        ) : (
                          'SETUP CLICKUP STRUCTURE'
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Setup Result */}
                {setupResult && (
                  <div className={cn(
                    "agentic-card-content border-t border-border",
                    setupResult.success ? "bg-[var(--live)]/5" : "bg-[var(--error)]/5"
                  )}>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {setupResult.success ? (
                          <Check className="w-4 h-4 text-[var(--live)]" />
                        ) : null}
                        <span className={cn(
                          "text-sm font-medium",
                          setupResult.success ? "text-[var(--live)]" : "text-[var(--error)]"
                        )}>
                          {setupResult.success ? 'Setup Complete!' : 'Setup had errors'}
                        </span>
                        {setupResult.duration && (
                          <span className="text-xs text-muted-foreground">
                            ({(setupResult.duration / 1000).toFixed(1)}s)
                          </span>
                        )}
                      </div>
                      
                      {setupResult.created && (
                        <div className="text-xs text-muted-foreground">
                          Created: {setupResult.created.folders} folders, {setupResult.created.lists} lists, {setupResult.created.tasks} tasks
                        </div>
                      )}
                      
                      {setupResult.skipped && (setupResult.skipped.folders > 0 || setupResult.skipped.lists > 0) && (
                        <div className="text-xs text-muted-foreground">
                          Skipped (already existed): {setupResult.skipped.folders} folders, {setupResult.skipped.lists} lists, {setupResult.skipped.tasks} tasks
                        </div>
                      )}

                      {setupResult.errors && setupResult.errors.length > 0 && (
                        <div className="text-xs text-[var(--error)] mt-2">
                          {setupResult.errors.slice(0, 5).map((e, i) => (
                            <div key={i}>• {e}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </FadeIn>
          )}

          {/* ClickUp -> RunAlNur / RunAlNur -> ClickUp Task Sync Mappings */}
          {clickupConnected && (
            <FadeIn className="mt-6">
              <div className="agentic-card">
                <div className="agentic-card-header flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FolderTree className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <h3 className="text-section">ClickUp Task Sync (Arm → List)</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Choose one ClickUp List per Arm as the sync target. Tasks created/updated in RunAlNur will write through to that list; ClickUp webhooks can mirror back into RunAlNur.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="agentic-card-content border-t border-border space-y-3">
                  {allClickUpLists.length === 0 ? (
                    <div className="text-xs text-muted-foreground">
                      No ClickUp lists found yet. Run the structure setup, or create lists in ClickUp first.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {ARMS.map((arm) => {
                        const current = mappingByArm.get(arm.id);
                        return (
                          <div key={arm.id} className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-xs font-medium">{arm.name}</div>
                              <div className="text-[10px] text-muted-foreground truncate">
                                {current ? `Mapped to: ${current.list_name || current.list_id}` : "Not mapped"}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <select
                                className="h-8 text-xs bg-muted/30 border border-border rounded px-2 max-w-[280px]"
                                value={current?.list_id || ""}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  if (v) void setArmMapping(arm.id, v);
                                }}
                              >
                                <option value="">Select a ClickUp list…</option>
                                {allClickUpLists.map((l) => (
                                  <option key={l.id} value={l.id}>
                                    {l.label}
                                  </option>
                                ))}
                              </select>
                              {current?.list_id ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-[10px] h-8 px-2 text-muted-foreground hover:text-destructive"
                                  onClick={() => void clearArmMapping(arm.id)}
                                >
                                  CLEAR
                                </Button>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </FadeIn>
          )}

          {/* Help text */}
          <div className="mt-6 p-4 bg-muted/30 rounded-lg">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Note:</span> Your API keys are encrypted 
              and stored securely on your account. ClickUp uses OAuth authentication. 
              Supabase is configured via environment variables.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="profile">
          <FadeIn className="agentic-card">
            <div className="agentic-card-header">
              <h2 className="text-section">Profile</h2>
            </div>
            <div className="agentic-card-content space-y-4">
              {profileLoading ? (
                <div className="text-sm text-muted-foreground">Loading profile...</div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground block mb-2">
                        Name
                      </label>
                      <Input 
                        value={name} 
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your name"
                        className="h-9 text-sm" 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground block mb-2">
                        Email
                      </label>
                      <Input 
                        value={email} 
                        disabled
                        className="h-9 text-sm font-mono bg-muted/50" 
                      />
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Email cannot be changed
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground block mb-2">
                      Title
                    </label>
                    <Input 
                      value={title} 
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Your role or title"
                      className="h-9 text-sm" 
                    />
                  </div>
                  {profileError && (
                    <div className="text-xs text-[var(--error)]">{profileError}</div>
                  )}
                  <div className="flex items-center gap-3">
                    <Button 
                      size="sm" 
                      className="text-xs"
                      onClick={handleSaveProfile}
                      disabled={profileSaving}
                    >
                      {profileSaving ? "SAVING..." : "SAVE CHANGES"}
                    </Button>
                    {profileSaved && (
                      <span className="text-xs text-[var(--live)] flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Saved
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          </FadeIn>
        </TabsContent>

        <TabsContent value="appearance">
          <FadeIn className="agentic-card">
            <div className="agentic-card-header">
              <div className="flex items-center gap-3">
                <Palette className="w-5 h-5 text-muted-foreground" />
                <div>
                  <h2 className="text-section">Appearance</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Customize how RunAlNur looks on your device
                  </p>
                </div>
              </div>
            </div>
            <div className="agentic-card-content">
              <ThemeToggle />
            </div>
          </FadeIn>
        </TabsContent>

        <TabsContent value="app">
          <FadeIn className="space-y-6">
            {/* Install App Card */}
            <div className="agentic-card">
              <div className="agentic-card-header">
                <div className="flex items-center gap-3">
                  <Smartphone className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <h2 className="text-section">Install App</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Get Dynasty OS as a native app on your device
                    </p>
                  </div>
                </div>
              </div>
              <div className="agentic-card-content space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">
                      {isInstalled ? "App Installed" : "Install Dynasty OS"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {isInstalled 
                        ? "You're using the installed version" 
                        : "Add to your home screen or dock for quick access"
                      }
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {isInstalled ? (
                      <div className="flex items-center gap-2 text-sm text-[var(--live)]">
                        <Check className="w-4 h-4" />
                        Installed
                      </div>
                    ) : (
                      <>
                        <InstallButton />
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2 text-xs"
                          onClick={() => setShowGuide(true)}
                        >
                          Installation Guide
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Benefits list */}
                <div className="p-4 bg-muted/30 rounded-lg space-y-2">
                  <p className="text-xs font-medium text-muted-foreground mb-3">Benefits of installing:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Check className="w-3 h-3 text-[var(--live)]" />
                      Full-screen native feel
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-3 h-3 text-[var(--live)]" />
                      Launch from dock/home screen
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-3 h-3 text-[var(--live)]" />
                      Automatic updates
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-3 h-3 text-[var(--live)]" />
                      Offline support
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Version Info Card */}
            <div className="agentic-card">
              <div className="agentic-card-header">
                <div className="flex items-center gap-3">
                  <Download className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <h2 className="text-section">Version Info</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Current app version and updates
                    </p>
                  </div>
                </div>
              </div>
              <div className="agentic-card-content">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-mono">Dynasty OS v1.0.0</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Updates are applied automatically
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {isInstalled ? "Standalone Mode" : "Browser Mode"}
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
        </TabsContent>
      </Tabs>

      {/* Integration Connect Modal */}
      {connectingIntegration && (
        <IntegrationConnectModal
          open={!!connectingIntegration}
          onOpenChange={(open) => !open && setConnectingIntegration(null)}
          integration={connectingIntegration}
          onConnect={handleConnect}
        />
      )}

      {/* Install Guide Modal */}
      <InstallGuideComponent />
    </div>
  );
}
