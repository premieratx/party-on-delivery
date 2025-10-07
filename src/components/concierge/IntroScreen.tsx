import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Sparkles, Crown, Star } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

interface IntroScreenProps {
  onEnter?: () => void;
}

export function IntroScreen({ onEnter }: IntroScreenProps) {
  const setShowIntro = useAppStore((state) => state.setShowIntro);

  const handleEnter = () => {
    if (onEnter) {
      onEnter();
    } else {
      setShowIntro(false);
    }
  };

  return (
    <div className="size-full flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-purple-600 via-purple-700 to-pink-600">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -100, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="text-center z-10 max-w-2xl px-8"
      >
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="mb-8"
        >
          <div className="flex items-center justify-center mb-6">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="relative"
            >
              <Crown className="w-20 h-20 text-yellow-400" />
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -top-2 -right-2"
              >
                <Sparkles className="w-8 h-8 text-yellow-300" />
              </motion.div>
            </motion.div>
          </div>

          <h1 className="text-6xl text-white mb-4 tracking-wide font-bold drop-shadow-2xl">
            PREMIER CONCIERGE
          </h1>

          <p className="text-2xl text-white/90 mb-2 drop-shadow-lg">Premium Services</p>

          <div className="flex items-center justify-center gap-2">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + i * 0.1, duration: 0.3 }}
              >
                <Star className="w-6 h-6 text-yellow-400 fill-current" />
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="space-y-6"
        >
          <p className="text-xl text-white/90 leading-relaxed drop-shadow-lg">
            Everything you need for an awesome weekend in Austin.
          </p>

          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              onClick={handleEnter}
              size="lg"
              className="bg-white/20 hover:bg-white/30 text-white px-12 py-6 rounded-full shadow-2xl border border-white/30 backdrop-blur-md"
            >
              <span className="mr-3">Enter Experience</span>
              <motion.div
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <Sparkles className="w-5 h-5" />
              </motion.div>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="space-y-2"
          >
            <p className="text-sm text-white/80 drop-shadow-md">
              Available 24/7 • Austin, Texas
            </p>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
