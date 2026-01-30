"use client";

import { motion, useReducedMotion } from "framer-motion";
import { spring } from "@/lib/motion/tokens";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Network, Building2, User, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function OwnershipMapPage() {
  const shouldReduce = useReducedMotion();

  // Mock ownership structure - will be replaced with real data
  const ownershipData = {
    topLevel: {
      name: "House Al Nur Family Trust",
      type: "Trust",
      children: [
        {
          name: "Maison Family Office LLC",
          type: "Holding",
          ownership: 100,
          children: [
            { name: "Nova Technologies LLC", type: "Operating", ownership: 100 },
            { name: "Janna Real Estate Holdings", type: "Real Estate", ownership: 100 },
            { name: "Silk Commerce Inc", type: "Operating", ownership: 100 },
          ],
        },
      ],
    },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={shouldReduce ? {} : { opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring.default}
      >
        <h1 className="text-2xl font-bold tracking-tight">Ownership Map</h1>
        <p className="text-sm text-muted-foreground">
          Visual representation of entity ownership structure
        </p>
      </motion.div>

      {/* Ownership Structure Visualization */}
      <motion.div
        initial={shouldReduce ? {} : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, ...spring.default }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Network className="w-5 h-5" />
              Entity Structure
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Top Level Entity */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                <div className="w-10 h-10 rounded-md bg-amber-500/20 flex items-center justify-center">
                  <User className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <h3 className="font-medium">{ownershipData.topLevel.name}</h3>
                  <p className="text-sm text-muted-foreground">{ownershipData.topLevel.type}</p>
                </div>
              </div>

              {/* First Level Children */}
              <div className="ml-8 border-l-2 border-border pl-8 space-y-4">
                {ownershipData.topLevel.children.map((child, idx) => (
                  <div key={idx}>
                    <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg">
                      <div className="w-10 h-10 rounded-md bg-blue-500/20 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-blue-500" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">{child.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {child.type} • {child.ownership}% owned
                        </p>
                      </div>
                      <Link href={`/capital/entities`}>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </Link>
                    </div>

                    {/* Second Level Children */}
                    {child.children && (
                      <div className="ml-8 border-l-2 border-border/50 pl-8 mt-4 space-y-3">
                        {child.children.map((grandchild, gIdx) => (
                          <div 
                            key={gIdx}
                            className="flex items-center gap-3 p-3 bg-background border rounded-lg"
                          >
                            <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center">
                              <Building2 className="w-4 h-4 text-muted-foreground" />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-sm font-medium">{grandchild.name}</h4>
                              <p className="text-xs text-muted-foreground">
                                {grandchild.type} • {grandchild.ownership}% owned
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Info Card */}
      <Card>
        <CardContent className="py-6">
          <div className="flex items-start gap-4">
            <Network className="w-6 h-6 text-muted-foreground mt-1" />
            <div>
              <h3 className="font-medium mb-1">Understanding the Structure</h3>
              <p className="text-sm text-muted-foreground">
                This ownership map shows how your legal entities are organized. 
                The trust at the top provides asset protection, while holding companies 
                own operating entities to separate liability and optimize tax efficiency.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
