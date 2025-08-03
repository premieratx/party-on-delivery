import React from 'react';
import { DeliveryWidget } from "@/components/DeliveryWidget";
import { VideoBackground } from "@/components/common/VideoBackground";
import { SystemTestingSuite } from "@/components/SystemTestingSuite";
import { PerformanceMonitor } from "@/components/common/PerformanceMonitor";

const Index = () => {
  return (
    <VideoBackground>
      {/* Performance Monitor (only shows in debug mode) */}
      <PerformanceMonitor />
      
      <DeliveryWidget />
      
      {/* System Testing Suite - Remove after testing */}
      <div className="mt-8 p-4 bg-background/95 backdrop-blur rounded-lg">
        <SystemTestingSuite />
      </div>
    </VideoBackground>
  );
};

export default Index;