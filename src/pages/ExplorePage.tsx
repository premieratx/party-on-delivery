import { Navigation } from '@/components/concierge/Navigation';
import AustinActivities from '@/components/concierge/AustinActivities';
import { useNavigate } from 'react-router-dom';

const ExplorePage = () => {
  const navigate = useNavigate();

  return (
    <>
      <AustinActivities onBack={() => navigate('/')} />
      <Navigation />
    </>
  );
};

export default ExplorePage;
