import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CreditCard, Plus, Minus } from 'lucide-react';
import type { Product } from '@shared/schema';
import type { SelectedProduct } from '@/lib/types';

interface ProductSelectionProps {
  selectedProduct: SelectedProduct | null;
  onSelectProduct: (product: SelectedProduct | null) => void;
  onProceedToPayment: () => void;
}

export default function ProductSelection({
  selectedProduct,
  onSelectProduct,
  onProceedToPayment
}: ProductSelectionProps) {
  const [quantities, setQuantities] = useState<{ [key: number]: number }>({});
  
  const { data: products, isLoading, error } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-charcoal via-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-luxe-gold border-t-transparent mx-auto mb-4"></div>
          <p className="text-platinum text-lg">Loading fragrances...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-charcoal via-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg">Failed to load products. Please try again.</p>
        </div>
      </div>
    );
  }

  const formatPrice = (priceInCents: number) => {
    return `₹${(priceInCents / 100).toFixed(2)}`;
  };

  const getQuantity = (productId: number) => {
    return quantities[productId] || 0;
  };

  const updateQuantity = (productId: number, newQuantity: number) => {
    setQuantities(prev => ({
      ...prev,
      [productId]: newQuantity
    }));

    // Auto-select product when quantity changes from 0 to any number
    if (newQuantity > 0) {
      const product = products?.find(p => p.id === productId);
      if (product) {
        onSelectProduct({
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          imageUrl: product.imageUrl,
          quantity: newQuantity,
        });
      }
    } else if (newQuantity === 0 && selectedProduct?.id === productId) {
      // Deselect product when quantity is set to 0
      onSelectProduct(null);
    }
  };

  const incrementQuantity = (productId: number) => {
    const currentQuantity = getQuantity(productId);
    if (currentQuantity < 5) {
      // Reset all other products to 0 when selecting a new product
      if (currentQuantity === 0) {
        const newQuantities: { [key: number]: number } = {};
        Object.keys(quantities).forEach(key => {
          newQuantities[parseInt(key)] = 0;
        });
        newQuantities[productId] = 1;
        setQuantities(newQuantities);
        
        const product = products?.find(p => p.id === productId);
        if (product) {
          onSelectProduct({
            id: product.id,
            name: product.name,
            description: product.description,
            price: product.price,
            imageUrl: product.imageUrl,
            quantity: 1,
          });
        }
      } else {
        updateQuantity(productId, currentQuantity + 1);
      }
    }
  };

  const decrementQuantity = (productId: number) => {
    const currentQuantity = getQuantity(productId);
    if (currentQuantity > 0) {
      updateQuantity(productId, currentQuantity - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-charcoal via-gray-900 to-black p-8 pb-16 overflow-y-auto">
      {/* Header */}
      <motion.div 
        className="text-center mb-12"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="font-serif text-4xl font-bold text-white mb-2">
          <span className="text-luxe-gold">SCENTRA</span> Collection
        </h1>
        <p className="text-platinum text-lg">Select your perfect fragrance spray</p>
      </motion.div>



      {/* Product Grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {products?.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: index * 0.1 + 0.3 }}
            className="flex"
          >
            <Card 
              className={`transition-all duration-300 touch-target flex-1 flex flex-col relative ${
                product.sprayStock === 0
                  ? 'cursor-not-allowed opacity-60 bg-white/5 border-gray-600'
                  : selectedProduct?.id === product.id
                  ? 'cursor-pointer ring-2 ring-luxe-gold bg-white/20 border-luxe-gold/50'
                  : 'cursor-pointer bg-white/10 border-luxe-gold/30 hover:bg-white/20'
              } backdrop-blur-sm border`}
              onClick={() => {
                // Auto-select 1 spray when clicking on the product card (only if in stock)
                if (product.sprayStock > 0 && getQuantity(product.id) === 0) {
                  // Reset all other products to 0 when selecting a new product
                  const newQuantities: { [key: number]: number } = {};
                  Object.keys(quantities).forEach(key => {
                    newQuantities[parseInt(key)] = 0;
                  });
                  newQuantities[product.id] = 1;
                  setQuantities(newQuantities);
                  
                  onSelectProduct({
                    id: product.id,
                    name: product.name,
                    description: product.description,
                    price: product.price,
                    imageUrl: product.imageUrl,
                    quantity: 1,
                  });
                }
              }}
            >
              <CardContent className="p-6 flex-1 flex flex-col">
                <div className="aspect-square mb-4 overflow-hidden rounded-xl relative">
                  <img 
                    src={product.imageUrl}
                    alt={product.name}
                    className={`w-full h-full object-cover ${product.sprayStock === 0 ? 'grayscale' : ''}`}
                  />
                  {product.sprayStock === 0 && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                      <span className="text-red-400 font-bold text-lg">OUT OF STOCK</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 flex flex-col">
                  <h3 className="font-serif text-lg font-semibold text-white mb-2 min-h-[3.5rem] flex items-center">
                    {product.name}
                  </h3>
                  <p className="text-platinum text-sm mb-4 flex-1 min-h-[2.5rem]">
                    {product.description}
                  </p>
                  <div className="flex justify-between items-center mt-auto mb-4">
                    <span className="text-luxe-gold font-bold text-lg">
                      {formatPrice(product.price)}
                    </span>
                    <span className="text-xs text-gray-400">per spray</span>
                  </div>
                  
                  {/* Individual Quantity Selector */}
                  <div className="border-t border-luxe-gold/30 pt-4">
                    {product.sprayStock === 0 ? (
                      <div className="text-center">
                        <p className="text-red-400 font-semibold text-sm mb-2">OUT OF STOCK</p>
                        <p className="text-gray-500 text-xs">Spray currently unavailable</p>
                      </div>
                    ) : (
                      <>
                        <p className="text-center text-platinum text-sm mb-3">
                          Number of Sprays 
                          <span className="text-xs text-gray-400 ml-2">({product.sprayStock} available)</span>
                        </p>
                        <div className="flex items-center justify-center space-x-3">
                          <Button
                            variant="outline"
                            size="sm"
                            className={`w-10 h-10 rounded-full border-luxe-gold/50 hover:border-luxe-gold hover:bg-luxe-gold/20 text-white p-0 transition-all duration-200 flex items-center justify-center ${
                              getQuantity(product.id) <= 0 || product.sprayStock === 0 ? 'opacity-50' : 'opacity-100'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              decrementQuantity(product.id);
                            }}
                            disabled={getQuantity(product.id) <= 0 || product.sprayStock === 0}
                          >
                            <Minus className="h-4 w-4 text-white" />
                          </Button>
                          <span className="text-2xl font-bold text-luxe-gold min-w-[3rem] text-center">
                            {getQuantity(product.id)}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            className={`w-10 h-10 rounded-full border-luxe-gold/50 hover:border-luxe-gold hover:bg-luxe-gold/20 text-white p-0 transition-all duration-200 flex items-center justify-center ${
                              getQuantity(product.id) >= Math.min(5, product.sprayStock) || product.sprayStock === 0 ? 'opacity-50' : 'opacity-100'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              incrementQuantity(product.id);
                            }}
                            disabled={getQuantity(product.id) >= Math.min(5, product.sprayStock) || product.sprayStock === 0}
                          >
                            <Plus className="h-4 w-4 text-white" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Selection Summary */}
      {selectedProduct && selectedProduct.quantity > 0 && (
        <motion.div
          className="max-w-2xl mx-auto"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="bg-white/10 backdrop-blur-sm border-luxe-gold/50 border">
            <CardContent className="p-6">
              <h3 className="font-serif text-2xl font-semibold text-white mb-4">
                Your Selection
              </h3>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <p className="text-white text-lg font-medium">
                    {selectedProduct.name}
                  </p>
                  <p className="text-platinum text-sm">
                    {selectedProduct.description}
                  </p>
                  <p className="text-luxe-gold text-sm font-medium mt-1">
                    {selectedProduct.quantity} spray{selectedProduct.quantity > 1 ? 's' : ''}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-luxe-gold text-2xl font-bold">
                    {formatPrice(selectedProduct.price * selectedProduct.quantity)}
                  </p>
                  <p className="text-gray-400 text-sm">
                    {formatPrice(selectedProduct.price)} per spray
                  </p>
                </div>
              </div>
              <Button
                onClick={onProceedToPayment}
                className="w-full bg-luxe-gold hover:bg-yellow-600 text-charcoal py-6 rounded-xl text-lg font-semibold touch-target transition-all duration-300 transform hover:scale-105"
              >
                <CreditCard className="mr-2 h-5 w-5" />
                Proceed to Payment
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
