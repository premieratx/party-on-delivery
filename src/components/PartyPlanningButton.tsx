import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PartyPopper } from "lucide-react";

export const PartyPlanningButton = () => {
  const navigate = useNavigate();

  return (
    <div className="flex justify-center py-6 px-4">
      <Button 
        onClick={() => navigate('/plan-my-party')}
        size="lg"
        className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-3"
      >
        <PartyPopper className="w-6 h-6" />
        Plan My Party
      </Button>
    </div>
  );
};