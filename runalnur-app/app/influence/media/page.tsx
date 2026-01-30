"use client";

import { motion, useReducedMotion } from "framer-motion";
import { spring, stagger } from "@/lib/motion/tokens";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Newspaper, ExternalLink, TrendingUp, Calendar } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function MediaMentionsPage() {
  const shouldReduce = useReducedMotion();
  const [now] = useState(() => Date.now());

  // Mock media mentions
  const mentions = [
    {
      id: "1",
      title: "House Al Nur's Nova Division Announces AI Partnership",
      source: "TechCrunch",
      date: "2024-01-18",
      sentiment: "positive",
      url: "#",
      excerpt: "The technology arm of the prominent House Al Nur family office has announced...",
    },
    {
      id: "2",
      title: "Janna Real Estate Expands into Sustainable Development",
      source: "Architectural Digest",
      date: "2024-01-15",
      sentiment: "positive",
      url: "#",
      excerpt: "Janna, the real estate division known for luxury developments, is pivoting towards...",
    },
    {
      id: "3",
      title: "Middle East Family Offices Increase Tech Investments",
      source: "Financial Times",
      date: "2024-01-10",
      sentiment: "neutral",
      url: "#",
      excerpt: "Among the notable family offices making moves is House Al Nur's Maison...",
    },
  ];

  const getSentimentBadge = (sentiment: string) => {
    switch (sentiment) {
      case "positive": return <Badge className="bg-green-500">Positive</Badge>;
      case "negative": return <Badge variant="destructive">Negative</Badge>;
      default: return <Badge variant="secondary">Neutral</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={shouldReduce ? {} : { opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring.default}
      >
        <div className="flex items-center gap-3">
          <Newspaper className="w-6 h-6 text-blue-500" />
          <h1 className="text-2xl font-bold tracking-tight">Media Mentions</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Track press coverage and media appearances of House Al Nur entities
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div
        className="grid gap-4 md:grid-cols-3"
        initial={shouldReduce ? {} : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, ...spring.default }}
      >
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{mentions.length}</div>
            <p className="text-xs text-muted-foreground">Total Mentions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-2xl font-bold">
                {mentions.filter(m => m.sentiment === "positive").length}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Positive Coverage</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {mentions.filter(m => new Date(m.date) > new Date(now - 7 * 24 * 60 * 60 * 1000)).length}
            </div>
            <p className="text-xs text-muted-foreground">This Week</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Mentions List */}
      <motion.div
        className="space-y-4"
        initial={shouldReduce ? {} : "hidden"}
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: stagger.normal, delayChildren: 0.2 },
          },
        }}
      >
        {mentions.map((mention) => (
          <motion.div
            key={mention.id}
            variants={{
              hidden: { opacity: 0, x: -20 },
              visible: { opacity: 1, x: 0, transition: spring.default },
            }}
          >
            <Card className="hover:bg-muted/50 transition-colors">
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline">{mention.source}</Badge>
                      {getSentimentBadge(mention.sentiment)}
                    </div>
                    <h3 className="font-medium mt-2">{mention.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {mention.excerpt}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                      <Calendar className="w-3 h-3" />
                      {mention.date}
                    </div>
                  </div>
                  <Link href={mention.url} target="_blank">
                    <ExternalLink className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
