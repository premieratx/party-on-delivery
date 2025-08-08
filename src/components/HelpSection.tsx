import { Button } from "@/components/ui/button";
import { Phone, MessageSquare } from "lucide-react";

export const HelpSection = () => {
  const phoneNumber = "7371234567"; // Placeholder - please update with actual number

  const handleCall = () => {
    window.location.href = `tel:${phoneNumber}`;
  };

  const handleSMS = () => {
    window.location.href = `sms:${phoneNumber}`;
  };

  return (
    <div className="text-center mt-8 p-6 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 flex flex-col justify-evenly gap-4 min-h-[10rem]">
      <h3 className="text-sm md:text-base font-semibold text-primary-foreground mb-2">
        Need Help? Give us a call or text!
      </h3>
      
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button 
          onClick={handleCall}
          variant="outline"
          className="bg-white/20 hover:bg-white/30 border-white/30 text-primary-foreground font-medium"
        >
          <Phone className="w-4 h-4 mr-2" />
          Call Now
        </Button>
        
        <Button 
          onClick={handleSMS}
          variant="outline"
          className="bg-white/20 hover:bg-white/30 border-white/30 text-primary-foreground font-medium"
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Send Text
        </Button>
      </div>
    </div>
  );
};