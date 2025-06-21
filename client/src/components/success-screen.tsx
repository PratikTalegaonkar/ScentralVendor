import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Check, Clock, Hand, Sparkles } from 'lucide-react';
import type { SelectedProduct } from '@/lib/types';

interface SuccessScreenProps {
  product: SelectedProduct;
  onNewOrder: () => void;
  onExploreBottles: () => void;
  onExit: () => void;
}

export default function SuccessScreen({ product, onNewOrder, onExploreBottles, onExit }: SuccessScreenProps) {
  const formatPrice = (priceInCents: number) => {
    return `₹${(priceInCents / 100).toFixed(2)}`;
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-charcoal via-gray-900 to-black flex items-center justify-center p-4">
      <motion.div 
        className="text-center w-full max-w-md"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          className="bg-green-500 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2, type: "spring", stiffness: 150 }}
        >
          <Check className="text-white text-3xl" />
        </motion.div>
        
        <h2 className="font-serif text-4xl font-bold text-white mb-4">
          Purchase Complete!
        </h2>
        
        <p className="text-platinum text-lg mb-8">
          Your <span className="text-luxe-gold font-semibold">{product.name}</span> ({product.quantity} spray{product.quantity > 1 ? 's' : ''}) is being prepared
        </p>
        
        <Card className="bg-white/10 backdrop-blur-sm border-luxe-gold/50 border mb-8">
          <CardContent className="p-6">
            <h3 className="font-semibold text-white mb-4">Collection Instructions</h3>
            <div className="space-y-3 text-left">
              <div className="flex items-center text-platinum">
                <Clock className="text-luxe-gold mr-3 h-5 w-5" />
                <span>Ready in 30 seconds</span>
              </div>
              <div className="flex items-center text-platinum">
                <Hand className="text-luxe-gold mr-3 h-5 w-5" />
                <span>Collect from dispenser below</span>
              </div>
              <div className="flex items-center text-platinum">
                <Sparkles className="text-luxe-gold mr-3 h-5 w-5" />
                <span>Enjoy your premium fragrance</span>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-600">
              <div className="flex justify-between items-center text-sm">
                <span className="text-platinum">Amount Paid:</span>
                <span className="text-luxe-gold font-semibold">
                  {formatPrice((product.price * product.quantity) + 500)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={onNewOrder}
              className="flex-1 bg-white/20 hover:bg-white/30 text-white border border-luxe-gold/50 hover:border-luxe-gold px-6 py-4 rounded-xl font-semibold touch-target transition-all duration-300"
              variant="outline"
              size="lg"
            >
              Try Another Fragrance
            </Button>
            <Button
              onClick={onExploreBottles}
              className="flex-1 bg-luxe-gold hover:bg-yellow-600 text-charcoal px-6 py-4 rounded-xl font-semibold touch-target transition-all duration-300"
              size="lg"
            >
              Explore Full Collection
            </Button>
          </div>
          <Button
            onClick={onExit}
            variant="outline"
            className="w-full bg-gray-600 hover:bg-gray-700 text-white border-gray-600 px-6 py-3 rounded-xl font-medium touch-target transition-all duration-300"
          >
            Exit to Home
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
