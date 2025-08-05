import React from 'react';
import { DeliveryWidget } from "@/components/DeliveryWidget";
import { VideoBackground } from "@/components/common/VideoBackground";
import { PerformanceMonitor } from "@/components/common/PerformanceMonitor";

const CustomPartyOnDeliveryStartScreen = () => {
  return (
    <VideoBackground>
      {/* Performance Monitor (only shows in debug mode) */}
      <PerformanceMonitor />
      
      <DeliveryWidget />
    </VideoBackground>
  );
};

export default CustomPartyOnDeliveryStartScreen;