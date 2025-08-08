import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Toaster } from "@/components/ui/toaster";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

// Existing performance components
import { PerformanceBenchmarkTest } from "@/components/PerformanceBenchmarkTest";
import { PerformanceReportGenerator } from "@/components/admin/PerformanceReportGenerator";
import { PerformanceTestRunner } from "@/components/admin/PerformanceTestRunner";
import { DatabaseOptimizationTester } from "@/components/admin/DatabaseOptimizationTester";
import { PerformanceChecklist } from "@/components/admin/PerformanceChecklist";

// Simple status type
type Status = "idle" | "running" | "passed" | "failed";

const PerformanceTests: React.FC = () => {
  const [optimizerStatus, setOptimizerStatus] = useState<Status>("idle");
  const [collectionsStatus, setCollectionsStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const [optimizerMessage, setOptimizerMessage] = useState<string>("");

  // Kick off a couple of automated checks on mount
  useEffect(() => {
    const run = async () => {
      setProgress(10);
      // Edge: performance-optimizer
      try {
        setOptimizerStatus("running");
        const { data, error } = await supabase.functions.invoke("performance-optimizer");
        if (error) throw error;
        if (data?.success) {
          setOptimizerStatus("passed");
          setOptimizerMessage(data?.message || "Optimization passed");
          toast({ title: "Performance optimizer", description: "Applied successfully" });
        } else {
          setOptimizerStatus("failed");
          setOptimizerMessage(data?.message || "Unknown response");
        }
      } catch (e: any) {
        setOptimizerStatus("failed");
        setOptimizerMessage(e?.message || "Failed to invoke optimizer");
      }
      setProgress(55);

      // Edge: get-all-collections (sanity for product cache)
      try {
        setCollectionsStatus("running");
        const { data, error } = await supabase.functions.invoke("get-all-collections", {
          body: { forceRefresh: false },
        });
        if (error) throw error;
        if (data && (data.collections || data.success || Array.isArray(data))) {
          setCollectionsStatus("passed");
        } else {
          setCollectionsStatus("failed");
        }
      } catch (e) {
        setCollectionsStatus("failed");
      }
      setProgress(85);

      // Finish
      setProgress(100);
    };

    run();
  }, []);

  const overallReady = optimizerStatus === "passed" && collectionsStatus === "passed";

  return (
    <>
      {/* Basic SEO */}
      <head>
        <title>Performance Test Suite | Client Readiness Check</title>
        <meta name="description" content="Run performance tests and readiness checks before sharing with clients and partners." />
        <link rel="canonical" href="/performance" />
      </head>

      <main className="container mx-auto px-4 py-6">
        <section className="mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Readiness</CardTitle>
              <CardDescription>Automated preflight plus manual deep-dive tests</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge variant={overallReady ? "default" : "destructive"}>
                  {overallReady ? "Ready (initial checks passed)" : "Needs review"}
                </Badge>
                <Progress value={progress} className="w-48" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <div className="text-sm font-medium">Edge Optimizer</div>
                  <Badge variant={optimizerStatus === "passed" ? "default" : optimizerStatus === "failed" ? "destructive" : "secondary"}>
                    {optimizerStatus.toUpperCase()}
                  </Badge>
                  {optimizerMessage && (
                    <div className="text-xs opacity-70 mt-1">{optimizerMessage}</div>
                  )}
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium">Collections Cache</div>
                  <Badge variant={collectionsStatus === "passed" ? "default" : collectionsStatus === "failed" ? "destructive" : "secondary"}>
                    {collectionsStatus.toUpperCase()}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium">Manual Suites</div>
                  <div className="text-xs opacity-70">Use the sections below to run full benchmark, DB, and app tests</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Manual deep-dive suites - user can click Run in each */}
        <section className="space-y-6">
          <article>
            <PerformanceBenchmarkTest />
          </article>
          <article>
            <PerformanceReportGenerator />
          </article>
          <article>
            <PerformanceTestRunner />
          </article>
          <article>
            <DatabaseOptimizationTester />
          </article>
          <article>
            <PerformanceChecklist />
          </article>
        </section>
      </main>
      <Toaster />
    </>
  );
};

export default PerformanceTests;
