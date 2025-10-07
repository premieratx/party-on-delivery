import { Navigation } from '@/components/concierge/Navigation';
import { Ship, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const BoatsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Ship className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Boat Rentals</h1>
        </div>
        <p className="text-muted-foreground mb-6">Reserve boats for Austin lake adventures.</p>
        
        <Button 
          onClick={() => navigate('/boats/quote')}
          className="w-full sm:w-auto gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          size="lg"
        >
          <Sparkles className="h-5 w-5" />
          Get it! Build my quote now
        </Button>
      </div>
      <Navigation />
    </div>
  );
};

export default BoatsPage;
