import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';

interface WelcomeScreenProps {
  onTryFragrance: () => void;
  onExploreCollection: () => void;
}

export default function WelcomeScreen({ onTryFragrance, onExploreCollection }: WelcomeScreenProps) {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-charcoal via-gray-900 to-black flex items-center justify-center">
      <div className="text-center">
        <motion.div 
          className="mb-8"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <h1 className="font-serif text-6xl font-bold text-white mb-4">
            Welcome to <span className="text-luxe-gold">SCENTRA</span>
          </h1>
          <p className="text-xl text-platinum font-light">
            Discover your perfect fragrance moment
          </p>
        </motion.div>
        
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Button
            onClick={onTryFragrance}
            className="bg-luxe-gold hover:bg-yellow-600 text-charcoal px-8 py-6 rounded-xl text-lg font-semibold touch-target transition-all duration-300 transform hover:scale-105 shadow-lg min-w-[200px]"
          >
            <Sparkles className="mr-2 h-5 w-5" />
            Try Fragrance
          </Button>
          
          <Button
            onClick={onExploreCollection}
            variant="outline"
            className="border-luxe-gold text-luxe-gold hover:bg-luxe-gold hover:text-charcoal px-8 py-6 rounded-xl text-lg font-semibold touch-target transition-all duration-300 transform hover:scale-105 shadow-lg min-w-[200px]"
          >
            <ArrowRight className="mr-2 h-5 w-5" />
            Explore Collection
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
