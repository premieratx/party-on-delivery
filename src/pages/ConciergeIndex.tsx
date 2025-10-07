import { AnimatePresence } from 'framer-motion';
import { IntroScreen } from '@/components/concierge/IntroScreen';
import { ConciergeHome } from '@/components/concierge/ConciergeHome';
import { Navigation } from '@/components/concierge/Navigation';
import { useAppStore } from '@/store/useAppStore';

const ConciergeIndex = () => {
  const showIntro = useAppStore((state) => state.showIntro);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-pink-600">
      <AnimatePresence mode="wait">
        {showIntro ? (
          <IntroScreen key="intro" />
        ) : (
          <div key="app">
            <ConciergeHome />
            <Navigation />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ConciergeIndex;
