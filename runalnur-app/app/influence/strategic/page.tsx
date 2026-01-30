"use client";

import { motion, useReducedMotion } from "framer-motion";
import { spring, stagger } from "@/lib/motion/tokens";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Target, TrendingUp, Building2, Users } from "lucide-react";
import Link from "next/link";

export default function StrategicContactsPage() {
  const shouldReduce = useReducedMotion();

  // Mock strategic contacts - people important for specific goals
  const strategicContacts = [
    {
      id: "1",
      name: "Sarah Chen",
      role: "Managing Partner",
      company: "Sequoia Capital",
      category: "Capital",
      strategicValue: "Series A funding for Nova",
      priority: "high",
    },
    {
      id: "2",
      name: "Mohammed Al-Rashid",
      role: "CEO",
      company: "Saudi Urban Development",
      category: "Partnership",
      strategicValue: "Janna expansion into KSA",
      priority: "high",
    },
    {
      id: "3",
      name: "David Park",
      role: "CTO",
      company: "NVIDIA",
      category: "Technology",
      strategicValue: "AI chip allocation",
      priority: "medium",
    },
    {
      id: "4",
      name: "Maria Santos",
      role: "Editor-in-Chief",
      company: "Architectural Digest",
      category: "Media",
      strategicValue: "Silk brand coverage",
      priority: "medium",
    },
  ];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Capital": return <TrendingUp className="w-4 h-4" />;
      case "Partnership": return <Users className="w-4 h-4" />;
      case "Technology": return <Building2 className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high": return <Badge variant="destructive">High Priority</Badge>;
      case "medium": return <Badge variant="secondary">Medium</Badge>;
      default: return <Badge variant="outline">{priority}</Badge>;
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
          <Target className="w-6 h-6 text-blue-500" />
          <h1 className="text-2xl font-bold tracking-tight">Strategic Contacts</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Key relationships aligned with specific strategic objectives
        </p>
      </motion.div>

      {/* Category Filters */}
      <motion.div
        className="flex gap-2 flex-wrap"
        initial={shouldReduce ? {} : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, ...spring.default }}
      >
        <Badge variant="outline" className="cursor-pointer hover:bg-muted">All</Badge>
        <Badge variant="outline" className="cursor-pointer hover:bg-muted">Capital</Badge>
        <Badge variant="outline" className="cursor-pointer hover:bg-muted">Partnership</Badge>
        <Badge variant="outline" className="cursor-pointer hover:bg-muted">Technology</Badge>
        <Badge variant="outline" className="cursor-pointer hover:bg-muted">Media</Badge>
      </motion.div>

      {/* Strategic Contacts List */}
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
        {strategicContacts.map((person) => (
          <motion.div
            key={person.id}
            variants={{
              hidden: { opacity: 0, x: -20 },
              visible: { opacity: 1, x: 0, transition: spring.default },
            }}
          >
            <Link href={`/influence/contacts/${person.id}`}>
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardContent className="py-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-blue-500/20 text-blue-700">
                        {person.name.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium truncate">{person.name}</h3>
                        {getCategoryIcon(person.category)}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {person.role} • {person.company}
                      </p>
                      <p className="text-xs text-blue-500 mt-1 flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        {person.strategicValue}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {getPriorityBadge(person.priority)}
                      <Badge variant="outline" className="text-xs">
                        {person.category}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
