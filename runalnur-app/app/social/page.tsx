"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Instagram, 
  Twitter, 
  Linkedin, 
  Youtube,
  Music,
  Plus,
  TrendingUp,
  Users,
  Heart,
  MessageSquare,
  Share2,
  Calendar,
  FileText,
  Sparkles,
} from "lucide-react";
import { FadeIn, Stagger } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/motion/tokens";
import { ARMS } from "@/lib/constants";

// ============================================================================
// Platform configs
// ============================================================================

const PLATFORMS = [
  { id: "instagram", name: "Instagram", icon: Instagram, color: "#E4405F", connected: false },
  { id: "tiktok", name: "TikTok", icon: Music, color: "#000000", connected: false },
  { id: "x", name: "X", icon: Twitter, color: "#000000", connected: false },
  { id: "linkedin", name: "LinkedIn", icon: Linkedin, color: "#0A66C2", connected: false },
  { id: "youtube", name: "YouTube", icon: Youtube, color: "#FF0000", connected: false },
];

// ============================================================================
// Mock data
// ============================================================================

const MOCK_STATS = {
  totalFollowers: 125430,
  totalPosts: 342,
  avgEngagement: 4.8,
  scheduledPosts: 12,
};

const MOCK_SCHEDULED_POSTS = [
  { id: "1", platform: "instagram", caption: "Dubai skyline at golden hour...", scheduledFor: "Today, 6:00 PM", mediaCount: 3 },
  { id: "2", platform: "x", caption: "Excited to announce our latest partnership...", scheduledFor: "Tomorrow, 9:00 AM", mediaCount: 1 },
  { id: "3", platform: "linkedin", caption: "Reflecting on our journey building House Al Nur...", scheduledFor: "Wed, 12:00 PM", mediaCount: 2 },
];

// ============================================================================
// Component
// ============================================================================

export default function SocialCommandPage() {
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <FadeIn>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
              <Share2 className="w-5 h-5 text-muted-foreground" />
              Social Command
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage all social media accounts from one place
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Calendar className="w-4 h-4 mr-2" />
              Content Calendar
            </Button>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              New Post
            </Button>
          </div>
        </div>
      </FadeIn>

      {/* Entity filter */}
      <FadeIn delay={0.05}>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setSelectedEntity(null)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium transition-colors shrink-0",
              !selectedEntity
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            All Accounts
          </button>
          {ARMS.filter(arm => ["nova", "janna", "atw", "obx", "house"].includes(arm.id)).map((arm) => (
            <button
              key={arm.id}
              onClick={() => setSelectedEntity(arm.id)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-colors shrink-0",
                selectedEntity === arm.id
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {arm.name}
            </button>
          ))}
          <button
            onClick={() => setSelectedEntity("personal")}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium transition-colors shrink-0",
              selectedEntity === "personal"
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            Nurullah
          </button>
        </div>
      </FadeIn>

      {/* Stats overview */}
      <FadeIn delay={0.1}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard 
            label="Total Followers" 
            value={formatNumber(MOCK_STATS.totalFollowers)}
            icon={<Users className="w-4 h-4" />}
            trend="+2.4%"
          />
          <StatCard 
            label="Total Posts" 
            value={MOCK_STATS.totalPosts.toString()}
            icon={<FileText className="w-4 h-4" />}
          />
          <StatCard 
            label="Avg Engagement" 
            value={`${MOCK_STATS.avgEngagement}%`}
            icon={<Heart className="w-4 h-4" />}
            trend="+0.3%"
          />
          <StatCard 
            label="Scheduled" 
            value={MOCK_STATS.scheduledPosts.toString()}
            icon={<Calendar className="w-4 h-4" />}
          />
        </div>
      </FadeIn>

      {/* Connected accounts */}
      <FadeIn delay={0.15}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              Connected Accounts
              <Button variant="ghost" size="sm" className="text-xs h-7">
                <Plus className="w-3 h-3 mr-1" />
                Connect
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {PLATFORMS.map((platform) => (
                <motion.button
                  key={platform.id}
                  className={cn(
                    "flex flex-col items-center justify-center p-4 rounded-lg border transition-colors",
                    platform.connected 
                      ? "border-border bg-card hover:bg-muted" 
                      : "border-dashed border-muted-foreground/30 hover:border-primary/50"
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={spring.snappy}
                >
                  <platform.icon 
                    className="w-6 h-6 mb-2" 
                    style={{ color: platform.connected ? platform.color : undefined }}
                  />
                  <span className="text-xs font-medium">{platform.name}</span>
                  <span className={cn(
                    "text-[10px] mt-1",
                    platform.connected ? "text-emerald-500" : "text-muted-foreground"
                  )}>
                    {platform.connected ? "Connected" : "Connect"}
                  </span>
                </motion.button>
              ))}
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      {/* Quick actions */}
      <FadeIn delay={0.2}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Create post */}
          <Card className="hover:border-primary/50 transition-colors cursor-pointer group">
            <CardContent className="p-6 flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Plus className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-medium group-hover:text-primary transition-colors">
                  Create New Post
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Compose and schedule across all platforms
                </p>
              </div>
            </CardContent>
          </Card>

          {/* AI caption */}
          <Card className="hover:border-primary/50 transition-colors cursor-pointer group">
            <CardContent className="p-6 flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h3 className="text-sm font-medium group-hover:text-primary transition-colors">
                  AI Caption Generator
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Generate captions with Claude AI
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Analytics */}
          <Card className="hover:border-primary/50 transition-colors cursor-pointer group">
            <CardContent className="p-6 flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-sm font-medium group-hover:text-primary transition-colors">
                  View Analytics
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Performance insights across platforms
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </FadeIn>

      {/* Scheduled posts */}
      <FadeIn delay={0.25}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              Upcoming Scheduled Posts
              <Button variant="ghost" size="sm" className="text-xs h-7">
                View all
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {MOCK_SCHEDULED_POSTS.map((post) => {
                const platform = PLATFORMS.find(p => p.id === post.platform);
                return (
                  <div
                    key={post.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                  >
                    {platform && (
                      <div 
                        className="w-8 h-8 rounded flex items-center justify-center"
                        style={{ backgroundColor: `${platform.color}20` }}
                      >
                        <platform.icon className="w-4 h-4" style={{ color: platform.color }} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{post.caption}</p>
                      <p className="text-xs text-muted-foreground">
                        {post.scheduledFor} · {post.mediaCount} {post.mediaCount === 1 ? "image" : "images"}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" className="shrink-0">
                      Edit
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}

// ============================================================================
// Stat Card
// ============================================================================

function StatCard({ 
  label, 
  value, 
  icon, 
  trend 
}: { 
  label: string; 
  value: string; 
  icon: React.ReactNode;
  trend?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">{label}</span>
          <span className="text-muted-foreground">{icon}</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold">{value}</span>
          {trend && (
            <span className="text-xs text-emerald-500">{trend}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}
