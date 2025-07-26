import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface PartyPlanningButtonProps {
  variant?: 'default' | 'resume';
}

export const PartyPlanningButton = ({ variant = 'default' }: PartyPlanningButtonProps) => {
  const navigate = useNavigate();

  if (variant === 'resume') {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button 
          onClick={() => navigate('/plan-my-party')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-lg"
        >
          Resume Planning
        </Button>
      </div>
    );
  }

  return (
    <Button 
      onClick={() => navigate('/plan-my-party')}
      className="w-full"
    >
      Plan My Party
    </Button>
  );
};