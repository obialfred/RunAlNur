"use client";

import { motion, useReducedMotion } from "framer-motion";
import { spring, stagger } from "@/lib/motion/tokens";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, Building, TrendingUp, Briefcase, Gem, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function ByAssetClassPage() {
  const shouldReduce = useReducedMotion();

  // Asset class definitions with icons
  const assetClasses = [
    { 
      id: "cash", 
      name: "Cash & Equivalents", 
      icon: Wallet, 
      value: 0, 
      allocation: 0,
      color: "text-green-500",
      bgColor: "bg-green-500/10"
    },
    { 
      id: "real-estate", 
      name: "Real Estate", 
      icon: Building, 
      value: 0, 
      allocation: 0,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10"
    },
    { 
      id: "public-equity", 
      name: "Public Equity", 
      icon: TrendingUp, 
      value: 0, 
      allocation: 0,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10"
    },
    { 
      id: "private-equity", 
      name: "Private Investments", 
      icon: Briefcase, 
      value: 0, 
      allocation: 0,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10"
    },
    { 
      id: "alternatives", 
      name: "Alternatives", 
      icon: Gem, 
      value: 0, 
      allocation: 0,
      color: "text-pink-500",
      bgColor: "bg-pink-500/10"
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={shouldReduce ? {} : { opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring.default}
      >
        <h1 className="text-2xl font-bold tracking-tight">Holdings by Asset Class</h1>
        <p className="text-sm text-muted-foreground">
          View portfolio allocation across different asset categories
        </p>
      </motion.div>

      {/* Asset Class Cards */}
      <motion.div
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
        initial={shouldReduce ? {} : "hidden"}
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: stagger.fast, delayChildren: 0.1 },
          },
        }}
      >
        {assetClasses.map((assetClass) => {
          const Icon = assetClass.icon;
          return (
            <motion.div
              key={assetClass.id}
              variants={{
                hidden: { opacity: 0, scale: 0.95 },
                visible: { opacity: 1, scale: 1, transition: spring.default },
              }}
            >
              <Link href={`/capital/by-asset/${assetClass.id}`}>
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                  <CardHeader className="flex flex-row items-center gap-4 pb-2">
                    <div className={`w-10 h-10 rounded-md ${assetClass.bgColor} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${assetClass.color}`} />
                    </div>
                    <CardTitle className="text-sm font-medium">{assetClass.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-2xl font-bold">${assetClass.value.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{assetClass.allocation}% allocation</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Allocation Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Asset Allocation</CardTitle>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center">
          <p className="text-muted-foreground">
            Allocation pie chart will be displayed here
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
