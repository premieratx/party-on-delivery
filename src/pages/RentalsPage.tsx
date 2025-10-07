import { Navigation } from '@/components/concierge/Navigation';
import VacationRentals from '@/components/concierge/VacationRentals';
import { useNavigate } from 'react-router-dom';

const RentalsPage = () => {
  const navigate = useNavigate();

  return (
    <>
      <VacationRentals onBack={() => navigate('/')} />
      <Navigation />
    </>
  );
};

export default RentalsPage;
