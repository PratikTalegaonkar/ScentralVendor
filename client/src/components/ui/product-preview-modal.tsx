import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Eye, Package, Droplets } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  price30ml: number;
  price60ml: number;
  price100ml: number;
  imageUrl: string;
  available: boolean;
  sprayStock: number;
  bottleStock30ml: number;
  bottleStock60ml: number;
  bottleStock100ml: number;
}

interface ProductPreviewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (product: Product) => void;
}

export default function ProductPreviewModal({ 
  product, 
  isOpen, 
  onClose, 
  onEdit 
}: ProductPreviewModalProps) {
  if (!product) return null;

  const formatPrice = (price: number) => {
    return `₹${(price / 100).toFixed(2)}`;
  };

  const getStockStatus = (stock: number, isBottle = false) => {
    if (!isBottle) return { color: 'green', text: `${stock} available` };
    
    if (stock === 0) return { color: 'red', text: 'Out of stock' };
    if (stock <= 5) return { color: 'yellow', text: `${stock} left` };
    if (stock >= 20) return { color: 'red', text: `${stock}/20 (MAX)` };
    return { color: 'green', text: `${stock}/20` };
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border-4 border-luxe-gold"
          >
            {/* Header */}
            <div className="flex justify-between items-start p-6 border-b border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-luxe-gold/20 rounded-xl">
                  <Eye className="h-6 w-6 text-luxe-gold" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Product Preview</h2>
                  <p className="text-platinum text-sm">Quick overview and details</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="lg"
                onClick={onClose}
                className="h-12 w-12 rounded-full bg-red-500 hover:bg-red-600 text-white border-none"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>

            {/* Product Content */}
            <div className="p-6 space-y-6">
              {/* Product Image and Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="aspect-square rounded-2xl overflow-hidden bg-gray-700 border-2 border-gray-600">
                    <img
                      src={product.imageUrl || 'https://via.placeholder.com/300x300/374151/9CA3AF?text=No+Image'}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://via.placeholder.com/300x300/374151/9CA3AF?text=No+Image';
                      }}
                      onLoad={(e) => {
                        // If the image loads successfully but is actually a webpage (not an image), show placeholder
                        const target = e.target as HTMLImageElement;
                        if (target.complete && target.naturalWidth === 0) {
                          target.src = 'https://via.placeholder.com/300x300/374151/9CA3AF?text=Invalid+URL';
                        }
                      }}
                    />
                  </div>
                  <div className="flex justify-center">
                    <Badge 
                      variant={product.available ? "default" : "destructive"}
                      className={`text-sm px-4 py-2 ${
                        product.available 
                          ? 'bg-green-600 hover:bg-green-700' 
                          : 'bg-red-600 hover:bg-red-700'
                      }`}
                    >
                      {product.available ? 'Available' : 'Unavailable'}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-3xl font-bold text-white mb-2">{product.name}</h3>
                    <p className="text-platinum text-lg leading-relaxed">{product.description}</p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-luxe-gold font-semibold text-lg flex items-center">
                      <Package className="h-5 w-5 mr-2" />
                      Pricing
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <Card className="bg-gray-800/50 border-gray-600">
                        <CardContent className="p-4 text-center">
                          <div className="text-sm text-platinum">Spray Sample</div>
                          <div className="text-xl font-bold text-luxe-gold">
                            {formatPrice(product.price)}
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-gray-800/50 border-gray-600">
                        <CardContent className="p-4 text-center">
                          <div className="text-sm text-platinum">30ml Bottle</div>
                          <div className="text-xl font-bold text-white">
                            {formatPrice(product.price30ml)}
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-gray-800/50 border-gray-600">
                        <CardContent className="p-4 text-center">
                          <div className="text-sm text-platinum">60ml Bottle</div>
                          <div className="text-xl font-bold text-white">
                            {formatPrice(product.price60ml)}
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-gray-800/50 border-gray-600">
                        <CardContent className="p-4 text-center">
                          <div className="text-sm text-platinum">100ml Bottle</div>
                          <div className="text-xl font-bold text-white">
                            {formatPrice(product.price100ml)}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stock Information */}
              <div className="space-y-4">
                <h4 className="text-luxe-gold font-semibold text-lg flex items-center">
                  <Droplets className="h-5 w-5 mr-2" />
                  Stock Levels
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Spray Stock */}
                  <Card className="bg-gray-800/50 border-gray-600">
                    <CardContent className="p-4">
                      <div className="text-center space-y-2">
                        <div className="text-sm text-platinum">Spray Stock</div>
                        <div className="text-2xl font-bold text-green-400">
                          {product.sprayStock}
                        </div>
                        <Badge variant="outline" className="text-xs border-green-400 text-green-400">
                          Unlimited
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  {/* 30ml Stock */}
                  {[
                    { size: '30ml', stock: product.bottleStock30ml },
                    { size: '60ml', stock: product.bottleStock60ml },
                    { size: '100ml', stock: product.bottleStock100ml }
                  ].map(({ size, stock }) => {
                    const status = getStockStatus(stock, true);
                    return (
                      <Card key={size} className="bg-gray-800/50 border-gray-600">
                        <CardContent className="p-4">
                          <div className="text-center space-y-2">
                            <div className="text-sm text-platinum">{size} Bottles</div>
                            <div className={`text-2xl font-bold ${
                              status.color === 'green' ? 'text-green-400' :
                              status.color === 'yellow' ? 'text-yellow-400' :
                              'text-red-400'
                            }`}>
                              {stock}
                            </div>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${
                                status.color === 'green' ? 'border-green-400 text-green-400' :
                                status.color === 'yellow' ? 'border-yellow-400 text-yellow-400' :
                                'border-red-400 text-red-400'
                              }`}
                            >
                              {status.text}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-700">
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="flex-1 h-14 text-lg bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
                >
                  Close Preview
                </Button>
                {onEdit && (
                  <Button
                    onClick={() => onEdit(product)}
                    className="flex-1 h-14 text-lg bg-luxe-gold hover:bg-luxe-gold/80 text-black font-semibold"
                  >
                    Edit Product
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}