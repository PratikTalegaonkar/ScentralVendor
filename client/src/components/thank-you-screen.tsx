import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Sparkles, Heart, CreditCard, Package } from "lucide-react";
import { SelectedProduct } from "@/lib/types";
import type { Product } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Declare Razorpay types
declare global {
  interface Window {
    Razorpay: any;
  }
}

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

// Remove static bottle options - will be dynamically generated from product data

export default function ThankYouScreen({ product, onNewOrder, onExploreBottles, onExit }: ThankYouScreenProps) {
  const [selectedBottles, setSelectedBottles] = useState<{[key: string]: string | null}>({});
  const [showPayment, setShowPayment] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  
  const queryClient = useQueryClient();
  const [razorpayConfig, setRazorpayConfig] = useState<any>(null);
  const { toast } = useToast();

  const { data: allProducts, isLoading } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  // Filter products to only show available products with bottle stock > 0
  const products = allProducts?.filter(product => 
    product.available && (
      product.bottleStock30ml > 0 || 
      product.bottleStock60ml > 0 || 
      product.bottleStock100ml > 0
    )
  );

  // Load Razorpay configuration and script
  useEffect(() => {
    const loadRazorpayConfig = async () => {
      try {
        const response = await apiRequest('GET', '/api/razorpay/config');
        const config = await response.json();
        setRazorpayConfig(config);

        // Load Razorpay script
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => setRazorpayLoaded(true);
        script.onerror = () => {
          console.log('Razorpay script failed to load');
          setRazorpayLoaded(true);
        };
        document.body.appendChild(script);

        return () => {
          if (document.body.contains(script)) {
            document.body.removeChild(script);
          }
        };
      } catch (error) {
        console.error('Failed to load Razorpay config:', error);
        setRazorpayLoaded(true);
      }
    };

    loadRazorpayConfig();
  }, []);

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
      const [productId] = key.split('-');
      const perfume = products?.find(p => p.id === parseInt(productId));
      let price = 0;
      if (size === '30ml') price = perfume?.price30ml || 0;
      else if (size === '60ml') price = perfume?.price60ml || 0;
      else if (size === '100ml') price = perfume?.price100ml || 0;
      return total + price;
    }, 0);
  };

  // Create order for bottles
  const createBottleOrderMutation = useMutation({
    mutationFn: async (bottles: any[]) => {
      const response = await apiRequest('POST', '/api/bottle-orders', { bottles });
      return response.json();
    },
    onSuccess: (result) => {
      // Use the order ID for payment processing
      if (result.order && result.order.id) {
        processBottlePayment(result.order.id);
      }
    },
    onError: () => {
      toast({
        title: "Order Error",
        description: "Failed to create bottle order. Please try again.",
        variant: "destructive",
      });
      setPaymentProcessing(false);
    },
  });

  // Create Razorpay order for bottles
  const createRazorpayBottleOrderMutation = useMutation({
    mutationFn: async ({ amount, orderId }: { amount: number; orderId: number }) => {
      const response = await apiRequest('POST', '/api/razorpay/order', {
        amount: amount / 100,
        orderId
      });
      return response.json();
    },
  });

  // Verify Razorpay payment for bottles
  const verifyBottlePaymentMutation = useMutation({
    mutationFn: async (paymentData: any) => {
      const response = await apiRequest('POST', '/api/razorpay/verify', paymentData);
      return response.json();
    },
    onSuccess: () => {
      setPaymentProcessing(false);
      setPaymentComplete(true);
      // Invalidate all relevant caches to refresh inventory
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/heatmap'] });
      toast({
        title: "Payment Successful",
        description: "Your bottle order has been confirmed!",
      });
    },
    onError: () => {
      toast({
        title: "Payment Verification Failed",
        description: "Payment verification failed. Please contact support.",
        variant: "destructive",
      });
      setPaymentProcessing(false);
    },
  });

  const processBottlePayment = async (orderId: number) => {
    if (!razorpayLoaded || !razorpayConfig) {
      toast({
        title: "Payment Error",
        description: "Payment system is not ready. Please try again.",
        variant: "destructive",
      });
      setPaymentProcessing(false);
      return;
    }

    try {
      const totalAmount = getTotalPrice();
      const razorpayOrder = await createRazorpayBottleOrderMutation.mutateAsync({
        amount: totalAmount,
        orderId
      });

      const options = {
        key: razorpayConfig.keyId,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: 'Scentra Vending - Bottles',
        description: 'Premium Fragrance Bottles',
        order_id: razorpayOrder.id,
        handler: function (response: any) {
          verifyBottlePaymentMutation.mutate({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            orderId: orderId
          });
        },
        prefill: {
          name: 'Customer',
          email: 'customer@example.com',
          contact: '9999999999'
        },
        theme: {
          color: '#D4AF37'
        },
        modal: {
          ondismiss: function() {
            setPaymentProcessing(false);
            toast({
              title: "Payment Cancelled",
              description: "Payment was cancelled by user.",
              variant: "destructive",
            });
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error('Razorpay payment error:', error);
      toast({
        title: "Payment Error",
        description: "Failed to initiate payment. Please try again.",
        variant: "destructive",
      });
      setPaymentProcessing(false);
    }
  };

  const handlePayment = async () => {
    const selectedBottlesList = getSelectedBottles();
    if (selectedBottlesList.length === 0) {
      toast({
        title: "No Selection",
        description: "Please select at least one bottle to purchase.",
        variant: "destructive",
      });
      return;
    }

    setPaymentProcessing(true);
    
    // Convert selected bottles to API format
    const bottles = selectedBottlesList.map(([key, size]) => {
      const [productId] = key.split('-');
      return {
        productId: parseInt(productId),
        bottleSize: size
      };
    });
    
    createBottleOrderMutation.mutate(bottles);
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
            {products?.filter(perfume => 
              // Only show products that have at least one bottle size with stock > 0
              perfume.bottleStock30ml > 0 || perfume.bottleStock60ml > 0 || perfume.bottleStock100ml > 0
            ).map((perfume) => (
              <Card key={perfume.id} className="bg-white/10 backdrop-blur-sm border-luxe-gold/30">
                <CardContent className="p-4">
                  <div className="text-center mb-4">
                    <img 
                      src={perfume.imageUrl || 'https://via.placeholder.com/64x80/374151/9CA3AF?text=No+Image'} 
                      alt={perfume.name}
                      className="w-16 h-20 object-cover mx-auto rounded-lg mb-2"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://via.placeholder.com/64x80/374151/9CA3AF?text=No+Image';
                      }}
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
                    {[
                      { size: '30ml', price: perfume.price30ml, stock: perfume.bottleStock30ml, description: 'Perfect for travel' },
                      { size: '60ml', price: perfume.price60ml, stock: perfume.bottleStock60ml, description: 'Ideal for daily use' },
                      { size: '100ml', price: perfume.price100ml, stock: perfume.bottleStock100ml, description: 'Best value luxury' }
                    ].filter(bottle => bottle.stock > 0).map((bottle) => {
                      const key = `${perfume.id}-${bottle.size}`;
                      const isSelected = selectedBottles[key] === bottle.size;
                      const isOutOfStock = bottle.stock === 0;
                      
                      return (
                        <Button
                          key={bottle.size}
                          onClick={() => !isOutOfStock && handleBottleSelect(perfume.id, bottle.size)}
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          disabled={isOutOfStock}
                          className={`w-full text-xs h-12 touch-target ${
                            isOutOfStock
                              ? 'bg-gray-600/50 text-gray-400 border-gray-600 cursor-not-allowed'
                              : isSelected 
                              ? 'bg-luxe-gold text-charcoal hover:bg-luxe-gold/90' 
                              : 'bg-white/10 text-white border-luxe-gold/30 hover:bg-luxe-gold/20'
                          }`}
                        >
                          <div className="flex justify-between items-center w-full">
                            <span>
                              {bottle.size}
                              {isOutOfStock && <span className="ml-1 text-red-400">(Out of Stock)</span>}
                            </span>
                            <span className={isOutOfStock ? 'line-through' : ''}>
                              {formatPrice(bottle.price)}
                            </span>
                          </div>
                          {!isOutOfStock && bottle.stock <= 5 && (
                            <div className="text-xs text-orange-300 mt-1">
                              Only {bottle.stock} left
                            </div>
                          )}
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
                  let price = 0;
                  if (size === '30ml') price = perfume?.price30ml || 0;
                  else if (size === '60ml') price = perfume?.price60ml || 0;
                  else if (size === '100ml') price = perfume?.price100ml || 0;
                  
                  return (
                    <div key={key} className="flex justify-between items-center text-sm">
                      <span className="text-white">
                        {perfume?.name} - {size}
                      </span>
                      <span className="text-luxe-gold font-medium">
                        {formatPrice(price)}
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

              <div className="space-y-4">
                <div className="text-center mb-4">
                  <h4 className="text-white font-medium mb-2">Secure Payment by Razorpay</h4>
                  <div className="text-sm text-platinum">
                    UPI • Cards • Net Banking • Wallets • EMI
                  </div>
                </div>
                
                <Button
                  onClick={handlePayment}
                  disabled={paymentProcessing || !razorpayLoaded}
                  className="w-full bg-luxe-gold hover:bg-luxe-gold/90 text-charcoal font-semibold py-6 text-xl touch-target transition-all duration-300 transform hover:scale-105"
                  size="lg"
                >
                  <CreditCard className="mr-2 h-6 w-6" />
                  {paymentProcessing ? 'Processing...' : !razorpayLoaded ? 'Loading...' : 'Pay with Razorpay'}
                </Button>
                
                {paymentProcessing && (
                  <div className="text-center text-platinum text-sm">
                    Opening secure payment gateway...
                  </div>
                )}
                
                <div className="text-center text-xs text-platinum/70">
                  🔒 Your payment information is encrypted and secure
                </div>
              </div>
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