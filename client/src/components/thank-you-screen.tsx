import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Sparkles, Heart, CreditCard, Package } from "lucide-react";
import { SelectedProduct } from "@/lib/types";
import type { Product } from "@shared/schema";

interface ThankYouScreenProps {
  product: SelectedProduct | null;
  onNewOrder: () => void;
  onExploreBottles: () => void;
  onExit: () => void;
}

interface BottleOption {
  size: string;
  price: number;
  description: string;
}

const bottleOptions: BottleOption[] = [
  { size: "30ml", price: 499900, description: "Perfect for travel" },
  { size: "60ml", price: 749900, description: "Ideal for daily use" },
  { size: "100ml", price: 1099900, description: "Best value luxury" }
];

export default function ThankYouScreen({ product, onNewOrder, onExploreBottles, onExit }: ThankYouScreenProps) {
  const [selectedBottles, setSelectedBottles] = useState<{[key: string]: string | null}>({});
  const [showPayment, setShowPayment] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  const handleBottleSelect = (productId: number, size: string) => {
    const key = `${productId}-${size}`;
    setSelectedBottles(prev => ({
      ...prev,
      [key]: prev[key] ? null : size
    }));
  };

  const getSelectedBottles = () => {
    return Object.entries(selectedBottles).filter(([_, size]) => size !== null);
  };

  const getTotalPrice = () => {
    return getSelectedBottles().reduce((total, [key, size]) => {
      const option = bottleOptions.find(b => b.size === size);
      return total + (option?.price || 0);
    }, 0);
  };

  const handlePayment = async () => {
    setPaymentProcessing(true);
    // Simulate payment processing
    setTimeout(() => {
      setPaymentProcessing(false);
      setPaymentComplete(true);
    }, 3000);
  };

  const formatPrice = (priceInCents: number) => {
    return `₹${(priceInCents / 100).toFixed(2)}`;
  };
  if (paymentComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-charcoal via-charcoal-light to-charcoal flex flex-col items-center justify-center p-6">
        <motion.div
          className="text-center max-w-2xl mx-auto"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <div className="bg-luxe-gold rounded-full p-6 mx-auto mb-6 w-20 h-20 flex items-center justify-center">
            <Package className="h-10 w-10 text-charcoal" />
          </div>
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-white mb-6">
            Order Complete!
          </h1>
          <div className="bg-white/10 backdrop-blur-sm border border-luxe-gold/50 rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-luxe-gold mb-4">
              Please Collect Your Fragrance from the Vending Machine Below
            </h2>
            <p className="text-platinum text-lg">
              Your bottles will be dispensed shortly. Thank you for your purchase!
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={onNewOrder}
              size="lg"
              className="bg-white/20 hover:bg-white/30 text-white border border-luxe-gold/50 hover:border-luxe-gold"
              variant="outline"
            >
              Try Another Fragrance
            </Button>
            <Button
              onClick={onExit}
              size="lg" 
              className="bg-luxe-gold hover:bg-luxe-gold/90 text-charcoal font-semibold"
            >
              Finish & Exit
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-charcoal via-charcoal-light to-charcoal p-6 overflow-y-auto">
      
      {/* Main Header Message */}
      <motion.div
        className="text-center mb-8 pt-8"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="flex items-center justify-center mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-luxe-gold rounded-full p-4 mr-4"
          >
            {product ? <Heart className="h-8 w-8 text-charcoal" /> : <ShoppingBag className="h-8 w-8 text-charcoal" />}
          </motion.div>
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-white">
            {product ? "Thank You!" : "Explore Collection"}
          </h1>
        </div>
        {product ? (
          <>
            <p className="text-platinum text-xl mb-2">
              Enjoy your {product.name} fragrance experience
            </p>
            <p className="text-platinum/70 text-lg">
              {product.quantity} spray{product.quantity > 1 ? 's' : ''} • ₹{((product.price * product.quantity) / 100).toFixed(2)}
            </p>
          </>
        ) : (
          <p className="text-platinum text-xl mb-2">
            Discover our complete fragrance collection in full-size bottles
          </p>
        )}
      </motion.div>

      {/* All Perfume Options */}
      <motion.div
        className="max-w-7xl mx-auto mb-8"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <div className="text-center mb-6">
          <Sparkles className="h-6 w-6 text-luxe-gold mx-auto mb-2" />
          <h2 className="font-serif text-2xl font-semibold text-white mb-2">
            Take Home Our Complete Collection
          </h2>
          <p className="text-platinum">Choose your favorite fragrances in full-size bottles</p>
        </div>

        {isLoading ? (
          <div className="text-center text-platinum">Loading fragrances...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {products?.map((perfume) => (
              <Card key={perfume.id} className="bg-white/10 backdrop-blur-sm border-luxe-gold/30">
                <CardContent className="p-4">
                  <div className="text-center mb-4">
                    <img 
                      src={perfume.imageUrl} 
                      alt={perfume.name}
                      className="w-16 h-20 object-cover mx-auto rounded-lg mb-2"
                    />
                    <h3 className="font-serif text-sm font-semibold text-white mb-1">
                      {perfume.name}
                    </h3>
                    <p className="text-platinum text-xs">
                      {perfume.description}
                    </p>
                  </div>
                  
                  {/* Bottle Size Options */}
                  <div className="space-y-2">
                    {bottleOptions.map((bottle) => {
                      const key = `${perfume.id}-${bottle.size}`;
                      const isSelected = selectedBottles[key] === bottle.size;
                      
                      return (
                        <Button
                          key={bottle.size}
                          onClick={() => handleBottleSelect(perfume.id, bottle.size)}
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          className={`w-full text-xs ${
                            isSelected 
                              ? 'bg-luxe-gold text-charcoal hover:bg-luxe-gold/90' 
                              : 'bg-white/10 text-white border-luxe-gold/30 hover:bg-luxe-gold/20'
                          }`}
                        >
                          <div className="flex justify-between items-center w-full">
                            <span>{bottle.size}</span>
                            <span>{formatPrice(bottle.price)}</span>
                          </div>
                        </Button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </motion.div>

      {/* Shopping Cart & Payment */}
      {getSelectedBottles().length > 0 && (
        <motion.div
          className="max-w-2xl mx-auto mb-8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="bg-white/10 backdrop-blur-sm border-luxe-gold/50">
            <CardContent className="p-6">
              <h3 className="font-serif text-xl font-semibold text-white mb-4 text-center">
                Your Bottle Selection
              </h3>
              
              <div className="space-y-2 mb-4">
                {getSelectedBottles().map(([key, size]) => {
                  const [productId] = key.split('-');
                  const perfume = products?.find(p => p.id === parseInt(productId));
                  const option = bottleOptions.find(b => b.size === size);
                  
                  return (
                    <div key={key} className="flex justify-between items-center text-sm">
                      <span className="text-white">
                        {perfume?.name} - {size}
                      </span>
                      <span className="text-luxe-gold font-medium">
                        {formatPrice(option?.price || 0)}
                      </span>
                    </div>
                  );
                })}
              </div>
              
              <div className="border-t border-luxe-gold/30 pt-4 mb-6">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span className="text-white">Total:</span>
                  <span className="text-luxe-gold">{formatPrice(getTotalPrice())}</span>
                </div>
              </div>

              {!showPayment ? (
                <Button
                  onClick={() => setShowPayment(true)}
                  className="w-full bg-luxe-gold hover:bg-luxe-gold/90 text-charcoal font-semibold py-3"
                  size="lg"
                >
                  <CreditCard className="mr-2 h-5 w-5" />
                  Proceed to Payment
                </Button>
              ) : (
                <div className="space-y-4">
                  <h4 className="text-white font-medium text-center">Payment Portal</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={handlePayment}
                      disabled={paymentProcessing}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {paymentProcessing ? "Processing..." : "Credit Card"}
                    </Button>
                    <Button
                      onClick={handlePayment}
                      disabled={paymentProcessing}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {paymentProcessing ? "Processing..." : "Contactless"}
                    </Button>
                  </div>
                  {paymentProcessing && (
                    <div className="text-center text-platinum text-sm">
                      Processing your payment...
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Action Buttons */}
      <motion.div
        className="flex flex-col sm:flex-row gap-4 mt-8 max-w-md mx-auto"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.6 }}
      >
        <Button
          onClick={onNewOrder}
          size="lg"
          className="bg-white/20 hover:bg-white/30 text-white border border-luxe-gold/50 hover:border-luxe-gold"
          variant="outline"
        >
          Try Another Fragrance
        </Button>
        <Button
          onClick={onExit}
          size="lg" 
          className="bg-luxe-gold hover:bg-luxe-gold/90 text-charcoal font-semibold"
        >
          Finish & Exit
        </Button>
      </motion.div>

      {/* Footer */}
      <motion.div
        className="mt-12 text-center pb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      >
        <p className="text-platinum/60 text-sm">
          Visit scentra.com for our complete fragrance collection
        </p>
      </motion.div>
    </div>
  );
}