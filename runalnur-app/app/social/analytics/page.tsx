"use client";

import { useState } from "react";
import { 
  TrendingUp, 
  TrendingDown,
  Users,
  Heart,
  MessageSquare,
  Eye,
  Share2,
  BarChart3,
} from "lucide-react";
import { FadeIn } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ARMS } from "@/lib/constants";

// Mock analytics data
const MOCK_METRICS = {
  followers: { value: 125430, change: 2.4, period: "vs last month" },
  engagement: { value: 4.8, change: 0.3, period: "vs last month" },
  reach: { value: 450000, change: -1.2, period: "vs last month" },
  impressions: { value: 890000, change: 5.7, period: "vs last month" },
};

const PLATFORM_METRICS = [
  { platform: "Instagram", followers: 45231, engagement: 5.2, posts: 89, color: "#E4405F" },
  { platform: "TikTok", followers: 32100, engagement: 8.1, posts: 45, color: "#000000" },
  { platform: "X", followers: 28450, engagement: 2.3, posts: 156, color: "#000000" },
  { platform: "LinkedIn", followers: 15600, engagement: 4.5, posts: 34, color: "#0A66C2" },
  { platform: "YouTube", followers: 4049, engagement: 3.8, posts: 18, color: "#FF0000" },
];

const TOP_POSTS = [
  { id: "1", platform: "Instagram", caption: "Dubai Marina sunset views 🌅", likes: 8234, comments: 342, reach: 45000 },
  { id: "2", platform: "TikTok", caption: "Day in the life of a CEO", likes: 12400, comments: 567, reach: 89000 },
  { id: "3", platform: "X", caption: "Excited to announce...", likes: 2340, comments: 89, reach: 23000 },
];

export default function SocialAnalyticsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<"week" | "month" | "quarter">("month");
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <FadeIn>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-muted-foreground" />
              Social Analytics
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Track performance across all platforms
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Period selector */}
            <div className="flex items-center border border-border rounded-md p-0.5">
              {(["week", "month", "quarter"] as const).map((period) => (
                <Button
                  key={period}
                  variant={selectedPeriod === period ? "secondary" : "ghost"}
                  size="sm"
                  className="h-7 text-xs capitalize"
                  onClick={() => setSelectedPeriod(period)}
                >
                  {period}
                </Button>
              ))}
            </div>
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
          {ARMS.filter(arm => ["nova", "janna", "atw", "obx"].includes(arm.id)).map((arm) => (
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

      {/* Overview metrics */}
      <FadeIn delay={0.1}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            label="Total Followers"
            value={formatNumber(MOCK_METRICS.followers.value)}
            change={MOCK_METRICS.followers.change}
            period={MOCK_METRICS.followers.period}
            icon={<Users className="w-4 h-4" />}
          />
          <MetricCard
            label="Avg Engagement"
            value={`${MOCK_METRICS.engagement.value}%`}
            change={MOCK_METRICS.engagement.change}
            period={MOCK_METRICS.engagement.period}
            icon={<Heart className="w-4 h-4" />}
          />
          <MetricCard
            label="Total Reach"
            value={formatNumber(MOCK_METRICS.reach.value)}
            change={MOCK_METRICS.reach.change}
            period={MOCK_METRICS.reach.period}
            icon={<Eye className="w-4 h-4" />}
          />
          <MetricCard
            label="Impressions"
            value={formatNumber(MOCK_METRICS.impressions.value)}
            change={MOCK_METRICS.impressions.change}
            period={MOCK_METRICS.impressions.period}
            icon={<Share2 className="w-4 h-4" />}
          />
        </div>
      </FadeIn>

      {/* Platform breakdown */}
      <FadeIn delay={0.15}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Platform Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {PLATFORM_METRICS.map((platform) => (
                <div key={platform.platform} className="flex items-center gap-4">
                  <div 
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: platform.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{platform.platform}</span>
                      <span className="text-sm">{formatNumber(platform.followers)} followers</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{platform.engagement}% engagement</span>
                      <span>{platform.posts} posts</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      {/* Top performing posts */}
      <FadeIn delay={0.2}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Top Performing Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {TOP_POSTS.map((post, index) => (
                <div
                  key={post.id}
                  className="flex items-center gap-4 p-3 rounded-lg bg-muted/50"
                >
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{post.caption}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{post.platform}</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground shrink-0">
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      {formatNumber(post.likes)}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      {formatNumber(post.comments)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {formatNumber(post.reach)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      {/* Connect accounts CTA */}
      <FadeIn delay={0.25}>
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <BarChart3 className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-sm font-medium mb-2">Connect your accounts for real data</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Link your social media accounts to see actual analytics and insights
            </p>
            <Button size="sm">Connect Accounts</Button>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}

// ============================================================================
// Metric Card
// ============================================================================

function MetricCard({
  label,
  value,
  change,
  period,
  icon,
}: {
  label: string;
  value: string;
  change: number;
  period: string;
  icon: React.ReactNode;
}) {
  const isPositive = change >= 0;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">{label}</span>
          <span className="text-muted-foreground">{icon}</span>
        </div>
        <div className="text-2xl font-semibold mb-1">{value}</div>
        <div className="flex items-center gap-1 text-xs">
          {isPositive ? (
            <TrendingUp className="w-3 h-3 text-emerald-500" />
          ) : (
            <TrendingDown className="w-3 h-3 text-rose-500" />
          )}
          <span className={isPositive ? "text-emerald-500" : "text-rose-500"}>
            {isPositive ? "+" : ""}{change}%
          </span>
          <span className="text-muted-foreground">{period}</span>
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
