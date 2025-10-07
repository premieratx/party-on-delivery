import { Navigation } from '@/components/concierge/Navigation';
import Transportation from '@/components/concierge/Transportation';
import { useNavigate } from 'react-router-dom';

const TransportPage = () => {
  const navigate = useNavigate();

  return (
    <>
      <Transportation onBack={() => navigate('/')} />
      <Navigation />
    </>
  );
};

export default TransportPage;
