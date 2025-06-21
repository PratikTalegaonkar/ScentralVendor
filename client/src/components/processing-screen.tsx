import { useEffect } from 'react';
import { motion } from 'framer-motion';

interface ProcessingScreenProps {
  onComplete: () => void;
}

export default function ProcessingScreen({ onComplete }: ProcessingScreenProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-charcoal via-gray-900 to-black flex items-center justify-center">
      <motion.div 
        className="text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          className="rounded-full h-16 w-16 border-4 border-luxe-gold border-t-transparent mx-auto mb-6"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <h2 className="font-serif text-3xl font-bold text-white mb-2">
          Processing Payment
        </h2>
        <p className="text-platinum">
          Please wait while we prepare your fragrance...
        </p>
      </motion.div>
    </div>
  );
}
