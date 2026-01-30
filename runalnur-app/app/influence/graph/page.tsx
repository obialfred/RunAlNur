"use client";

import { motion, useReducedMotion } from "framer-motion";
import { spring } from "@/lib/motion/tokens";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Network, Info, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NetworkGraphPage() {
  const shouldReduce = useReducedMotion();

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={shouldReduce ? {} : { opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring.default}
      >
        <div className="flex items-center gap-3">
          <Network className="w-6 h-6 text-purple-500" />
          <h1 className="text-2xl font-bold tracking-tight">Network Graph</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Visual map of your relationships and their interconnections
        </p>
      </motion.div>

      {/* Graph Visualization Placeholder */}
      <motion.div
        initial={shouldReduce ? {} : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, ...spring.default }}
      >
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Relationship Network</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-8 w-8">
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8">
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8">
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[500px] bg-muted/30 rounded-lg flex items-center justify-center relative">
              {/* Placeholder for actual graph visualization */}
              <div className="text-center">
                <Network className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Interactive network graph will be displayed here
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Powered by D3.js or similar visualization library
                </p>
              </div>

              {/* Mock nodes for visual effect */}
              <motion.div
                className="absolute w-12 h-12 rounded-full bg-purple-500/20 border-2 border-purple-500"
                style={{ top: "40%", left: "50%" }}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <motion.div
                className="absolute w-8 h-8 rounded-full bg-blue-500/20 border-2 border-blue-500"
                style={{ top: "25%", left: "35%" }}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
              />
              <motion.div
                className="absolute w-8 h-8 rounded-full bg-amber-500/20 border-2 border-amber-500"
                style={{ top: "55%", left: "65%" }}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
              />
              <motion.div
                className="absolute w-6 h-6 rounded-full bg-green-500/20 border-2 border-green-500"
                style={{ top: "30%", left: "70%" }}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.9 }}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Info className="w-4 h-4" />
            Graph Legend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-purple-500" />
              <span className="text-sm">You</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-amber-500" />
              <span className="text-sm">Inner Circle</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-500" />
              <span className="text-sm">Strategic</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-500" />
              <span className="text-sm">General</span>
            </div>
          </div>
          <div className="mt-4 text-xs text-muted-foreground">
            Node size indicates relationship strength. Line thickness shows interaction frequency.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
