import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface PartyPlanningButtonProps {
  variant?: 'default' | 'resume';
}

export const PartyPlanningButton = ({ variant = 'default' }: PartyPlanningButtonProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    console.log('PartyPlanningButton: Navigating to /plan-my-party');
    navigate('/plan-my-party');
  };

  if (variant === 'resume') {
    return (
      <div className="fixed bottom-20 right-4 z-40"> {/* Adjusted for bottom nav */}
        <Button 
          onClick={handleClick}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg shadow-lg text-sm sm:text-base"
        >
          Resume Planning
        </Button>
      </div>
    );
  }

  return (
    <Button 
      onClick={handleClick}
      className="w-full h-10 sm:h-12 text-sm sm:text-base"
    >
      Plan My Party
    </Button>
  );
};