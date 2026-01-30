"use client";

import { motion, useReducedMotion } from "framer-motion";
import { spring, stagger } from "@/lib/motion/tokens";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Star, MessageCircle, Calendar } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function InnerCirclePage() {
  const shouldReduce = useReducedMotion();
  const [now] = useState(() => Date.now());

  // Mock inner circle contacts - these are your most important relationships
  const innerCircle = [
    {
      id: "1",
      name: "Sheikh Abdullah Al-Fahad",
      role: "Strategic Partner",
      company: "Al-Fahad Holdings",
      lastContact: "2024-01-15",
      relationshipStrength: 0.85,
      notes: "Key partner for Green Oasis project",
    },
    {
      id: "2",
      name: "Dr. Aisha Rahman",
      role: "Advisor",
      company: "Rahman Foundation",
      lastContact: "2024-01-10",
      relationshipStrength: 0.92,
      notes: "Family friend, cultural initiatives",
    },
    {
      id: "3",
      name: "Ambassador Chen Wei",
      role: "Diplomatic Contact",
      company: "Chinese Embassy",
      lastContact: "2024-01-05",
      relationshipStrength: 0.78,
      notes: "Silk Road trade connections",
    },
  ];

  const getStrengthColor = (strength: number) => {
    if (strength >= 0.8) return "bg-green-500";
    if (strength >= 0.5) return "bg-amber-500";
    return "bg-red-500";
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
          <Star className="w-6 h-6 text-amber-500" />
          <h1 className="text-2xl font-bold tracking-tight">Inner Circle</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Your most trusted advisors, partners, and key relationships
        </p>
      </motion.div>

      {/* Summary */}
      <motion.div
        initial={shouldReduce ? {} : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, ...spring.default }}
        className="grid gap-4 md:grid-cols-3"
      >
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{innerCircle.length}</div>
            <p className="text-xs text-muted-foreground">Inner Circle Members</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {Math.round(innerCircle.reduce((a, c) => a + c.relationshipStrength, 0) / innerCircle.length * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">Avg Relationship Health</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {innerCircle.filter(c => new Date(c.lastContact) > new Date(now - 7 * 24 * 60 * 60 * 1000)).length}
            </div>
            <p className="text-xs text-muted-foreground">Contacted This Week</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Inner Circle List */}
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
        {innerCircle.map((person) => (
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
                      <AvatarFallback className="bg-amber-500/20 text-amber-700">
                        {person.name.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium truncate">{person.name}</h3>
                        <Star className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {person.role} • {person.company}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{person.notes}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getStrengthColor(person.relationshipStrength)}`} />
                        <span className="text-sm font-medium">
                          {Math.round(person.relationshipStrength * 100)}%
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {person.lastContact}
                      </div>
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
