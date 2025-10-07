import { Navigation } from '@/components/concierge/Navigation';
import ItineraryView from '@/components/concierge/ItineraryView';
import { useNavigate } from 'react-router-dom';

const ItineraryPage = () => {
  const navigate = useNavigate();

  return (
    <>
      <ItineraryView onBack={() => navigate('/')} />
      <Navigation />
    </>
  );
};

export default ItineraryPage;
