import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CreditCard, Smartphone, Wifi, X } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { SelectedProduct, PaymentMethod } from '@/lib/types';

// Declare Razorpay types
declare global {
  interface Window {
    Razorpay: any;
  }
}

const paymentMethods: PaymentMethod[] = [
  { id: 'razorpay', name: 'Razorpay (UPI/Cards/Wallets)', icon: 'credit-card' },
  { id: 'card', name: 'Credit/Debit Card', icon: 'credit-card' },
  { id: 'digital', name: 'Digital Wallet', icon: 'smartphone' },
  { id: 'contactless', name: 'Contactless Pay', icon: 'wifi' },
];

const getIcon = (iconName: string) => {
  switch (iconName) {
    case 'credit-card':
      return CreditCard;
    case 'smartphone':
      return Smartphone;
    case 'wifi':
      return Wifi;
    default:
      return CreditCard;
  }
};

interface PaymentModalProps {
  product: SelectedProduct;
  selectedPaymentMethod: string | null;
  onSelectPaymentMethod: (method: string) => void;
  onCancel: () => void;
  onConfirm: (orderId: number) => void;
}

export default function PaymentModal({
  product,
  selectedPaymentMethod,
  onSelectPaymentMethod,
  onCancel,
  onConfirm
}: PaymentModalProps) {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [razorpayConfig, setRazorpayConfig] = useState<any>(null);

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
          console.log('Razorpay script failed to load, using test mode');
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
        setRazorpayConfig({ enabled: false, testMode: true, keyId: 'rzp_test_demo' });
        setRazorpayLoaded(true);
      }
    };

    loadRazorpayConfig();
  }, []);

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const response = await apiRequest('POST', '/api/orders', orderData);
      return response.json();
    },
    onSuccess: (order) => {
      processPayment(order.id);
    },
    onError: () => {
      toast({
        title: "Order Error",
        description: "Failed to create order. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
    },
  });

  // Create Razorpay order
  const createRazorpayOrderMutation = useMutation({
    mutationFn: async ({ amount, orderId }: { amount: number; orderId: number }) => {
      const response = await apiRequest('POST', '/api/razorpay/order', {
        amount: amount / 100, // Convert paise to rupees
        orderId
      });
      return response.json();
    },
  });

  // Verify Razorpay payment
  const verifyRazorpayPaymentMutation = useMutation({
    mutationFn: async (paymentData: any) => {
      const response = await apiRequest('POST', '/api/razorpay/verify', paymentData);
      return response.json();
    },
    onSuccess: (result) => {
      onConfirm(result.order.id);
    },
    onError: () => {
      toast({
        title: "Payment Verification Failed",
        description: "Payment verification failed. Please contact support.",
        variant: "destructive",
      });
      setIsProcessing(false);
    },
  });

  const processPaymentMutation = useMutation({
    mutationFn: async ({ orderId, paymentMethod }: { orderId: number; paymentMethod: string }) => {
      const response = await apiRequest('POST', `/api/orders/${orderId}/payment`, { paymentMethod });
      return response.json();
    },
    onSuccess: (result) => {
      onConfirm(result.order.id);
    },
    onError: () => {
      toast({
        title: "Payment Error",
        description: "Payment processing failed. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
    },
  });

  const processRazorpayPayment = async (orderId: number) => {
    if (!razorpayLoaded || !razorpayConfig) {
      toast({
        title: "Payment Error",
        description: "Payment system is not ready. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
      return;
    }

    try {
      // Create Razorpay order
      const razorpayOrder = await createRazorpayOrderMutation.mutateAsync({
        amount: total,
        orderId
      });

      if (razorpayConfig.testMode || !window.Razorpay) {
        // Test mode - simulate payment flow
        toast({
          title: "Test Payment Mode",
          description: "Simulating payment processing...",
          variant: "default",
        });

        // Simulate payment processing delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Directly verify payment in test mode
        verifyRazorpayPaymentMutation.mutate({
          razorpay_order_id: razorpayOrder.id,
          razorpay_payment_id: `pay_test_${Date.now()}`,
          razorpay_signature: 'test_signature',
          orderId: orderId
        });
      } else {
        // Production mode - use actual Razorpay
        const options = {
          key: razorpayConfig.keyId,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          name: 'Scentra Vending',
          description: `${product.name} - Premium Fragrance`,
          order_id: razorpayOrder.id,
          handler: function (response: any) {
            // Verify payment
            verifyRazorpayPaymentMutation.mutate({
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
            color: '#D4AF37' // Gold color matching the theme
          },
          modal: {
            ondismiss: function() {
              setIsProcessing(false);
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
      }
    } catch (error) {
      console.error('Razorpay payment error:', error);
      toast({
        title: "Payment Error",
        description: "Failed to initiate payment. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  const processPayment = (orderId: number) => {
    if (!selectedPaymentMethod) return;
    
    if (selectedPaymentMethod === 'razorpay') {
      processRazorpayPayment(orderId);
    } else {
      processPaymentMutation.mutate({
        orderId,
        paymentMethod: selectedPaymentMethod,
      });
    }
  };

  const handleConfirmPayment = () => {
    if (!selectedPaymentMethod) return;
    
    setIsProcessing(true);
    
    // Create order first
    createOrderMutation.mutate({
      productId: product.id,
      paymentMethod: selectedPaymentMethod,
      amount: total,
      status: 'pending',
    });
  };

  const formatPrice = (priceInCents: number) => {
    return `₹${(priceInCents / 100).toFixed(2)}`;
  };

  const subtotal = product.price * product.quantity;
  const tax = 500; // ₹5.00 tax
  const total = subtotal + tax;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <Card className="bg-white/95 backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <div className="bg-luxe-gold rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <CreditCard className="text-charcoal text-2xl" />
              </div>
              <h2 className="font-serif text-2xl font-bold text-charcoal mb-2">
                Secure Payment
              </h2>
              <p className="text-gray-600">Complete your purchase</p>
            </div>

            {/* Payment Summary */}
            <div className="bg-gray-100 rounded-xl p-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-700">{product.name}</span>
                <span className="font-semibold text-charcoal">
                  {formatPrice(product.price)}
                </span>
              </div>
              <div className="flex justify-between items-center mb-2 text-sm text-gray-600">
                <span>Quantity ({product.quantity} spray{product.quantity > 1 ? 's' : ''})</span>
                <span>{formatPrice(product.price * product.quantity)}</span>
              </div>
              <div className="flex justify-between items-center text-sm text-gray-600">
                <span>Tax</span>
                <span>{formatPrice(tax)}</span>
              </div>
              <hr className="my-2" />
              <div className="flex justify-between items-center font-bold text-charcoal">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="space-y-3 mb-6">
              {paymentMethods.map((method) => {
                const IconComponent = getIcon(method.icon);
                const isRazorpay = method.id === 'razorpay';
                const showTestMode = isRazorpay && razorpayConfig?.testMode;
                
                return (
                  <Button
                    key={method.id}
                    variant="outline"
                    className={`w-full flex items-center justify-between p-4 h-auto touch-target transition-colors ${
                      selectedPaymentMethod === method.id
                        ? 'border-luxe-gold bg-yellow-50 text-charcoal'
                        : 'border-gray-200 hover:border-luxe-gold'
                    }`}
                    onClick={() => onSelectPaymentMethod(method.id)}
                  >
                    <div className="flex items-center flex-1">
                      <IconComponent className="text-luxe-gold mr-3 h-5 w-5" />
                      <div className="text-left">
                        <span className="font-medium block">{method.name}</span>
                        {showTestMode && (
                          <span className="text-xs text-amber-600 font-medium">Test Mode Active</span>
                        )}
                      </div>
                    </div>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </Button>
                );
              })}
            </div>

            <div className="flex space-x-3">
              <Button
                variant="outline"
                className="flex-1 touch-target"
                onClick={onCancel}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-luxe-gold hover:bg-yellow-600 text-charcoal touch-target"
                onClick={handleConfirmPayment}
                disabled={!selectedPaymentMethod || isProcessing}
              >
                {isProcessing ? 'Processing...' : 'Pay Now'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
