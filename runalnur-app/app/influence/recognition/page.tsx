"use client";

import { motion, useReducedMotion } from "framer-motion";
import { spring, stagger } from "@/lib/motion/tokens";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, Trophy, Medal, Star, Calendar } from "lucide-react";

export default function RecognitionPage() {
  const shouldReduce = useReducedMotion();

  // Mock recognition/awards data
  const recognitions = [
    {
      id: "1",
      title: "Forbes Middle East 100",
      description: "Listed among the top 100 influential Arab leaders",
      category: "Business",
      date: "2024-01",
      icon: Trophy,
    },
    {
      id: "2",
      title: "Sustainable Development Award",
      description: "Janna recognized for eco-friendly building practices",
      category: "Sustainability",
      date: "2023-11",
      icon: Award,
    },
    {
      id: "3",
      title: "Tech Innovator of the Year",
      description: "Nova's AI initiatives honored by Gulf Tech Council",
      category: "Technology",
      date: "2023-10",
      icon: Medal,
    },
  ];

  const memberships = [
    { name: "World Economic Forum", type: "Young Global Leader", since: "2022" },
    { name: "Aspen Institute", type: "Fellow", since: "2021" },
    { name: "Council on Foreign Relations", type: "Term Member", since: "2023" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={shouldReduce ? {} : { opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring.default}
      >
        <div className="flex items-center gap-3">
          <Award className="w-6 h-6 text-amber-500" />
          <h1 className="text-2xl font-bold tracking-tight">Recognition & Awards</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Track achievements, awards, and institutional memberships
        </p>
      </motion.div>

      {/* Awards Grid */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Awards & Honors</h2>
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
          {recognitions.map((item) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: spring.default },
                }}
              >
                <Card className="h-full">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-6 h-6 text-amber-500" />
                      </div>
                      <div>
                        <Badge variant="outline" className="mb-2">{item.category}</Badge>
                        <h3 className="font-medium">{item.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {item.description}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                          <Calendar className="w-3 h-3" />
                          {item.date}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Memberships */}
      <motion.div
        initial={shouldReduce ? {} : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, ...spring.default }}
      >
        <h2 className="text-lg font-semibold mb-4">Institutional Memberships</h2>
        <Card>
          <CardContent className="py-4">
            <div className="space-y-4">
              {memberships.map((membership, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <Star className="w-4 h-4 text-amber-500" />
                    <div>
                      <h4 className="font-medium">{membership.name}</h4>
                      <p className="text-sm text-muted-foreground">{membership.type}</p>
                    </div>
                  </div>
                  <Badge variant="outline">Since {membership.since}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Placeholder for more */}
      <Card>
        <CardContent className="py-8 text-center">
          <Award className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">
            Add more recognition and achievements to build your legitimacy profile
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
