"use client";

import { motion, useReducedMotion } from "framer-motion";
import { spring, stagger } from "@/lib/motion/tokens";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function ByEntityPage() {
  const shouldReduce = useReducedMotion();

  // Mock entities - will be replaced with real data from database
  const entities = [
    { id: "1", name: "Maison Family Office", type: "Holding", totalValue: 0, assetCount: 0 },
    { id: "2", name: "Nova Technologies LLC", type: "Operating", totalValue: 0, assetCount: 0 },
    { id: "3", name: "Janna Real Estate Holdings", type: "Real Estate", totalValue: 0, assetCount: 0 },
    { id: "4", name: "Silk Commerce Inc", type: "Operating", totalValue: 0, assetCount: 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={shouldReduce ? {} : { opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring.default}
      >
        <h1 className="text-2xl font-bold tracking-tight">Holdings by Entity</h1>
        <p className="text-sm text-muted-foreground">
          View assets organized by legal entity structure
        </p>
      </motion.div>

      {/* Entity Cards */}
      <motion.div
        className="space-y-4"
        initial={shouldReduce ? {} : "hidden"}
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: stagger.normal, delayChildren: 0.1 },
          },
        }}
      >
        {entities.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Building2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">No entities configured yet</p>
              <Link href="/capital/entities" className="text-sm text-primary mt-2 inline-block">
                Add your first entity →
              </Link>
            </CardContent>
          </Card>
        ) : (
          entities.map((entity) => (
            <motion.div
              key={entity.id}
              variants={{
                hidden: { opacity: 0, x: -20 },
                visible: { opacity: 1, x: 0, transition: spring.default },
              }}
            >
              <Link href={`/capital/entities/${entity.id}`}>
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                          <h3 className="font-medium">{entity.name}</h3>
                          <p className="text-sm text-muted-foreground">{entity.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-medium">${entity.totalValue.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">{entity.assetCount} assets</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))
        )}
      </motion.div>
    </div>
  );
}
