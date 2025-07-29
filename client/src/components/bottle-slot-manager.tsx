import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import VirtualInput from '@/components/ui/virtual-input';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { Product } from '@shared/schema';

interface BottleSlotManagerProps {
  slotNumber: number;
  products: Product[];
  productInSlot?: Product;
  onSlotUpdate: () => void;
}

export default function BottleSlotManager({
  slotNumber,
  products,
  productInSlot,
  onSlotUpdate
}: BottleSlotManagerProps) {
  const [selectedProductId, setSelectedProductId] = useState<number>(productInSlot?.id || 0);
  const [selectedBottleSize, setSelectedBottleSize] = useState<'30ml' | '60ml' | '100ml'>('30ml');
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get current stock for the selected size
  const getCurrentStock = () => {
    if (!productInSlot) return 0;
    switch (selectedBottleSize) {
      case '30ml': return productInSlot.bottleStock30ml;
      case '60ml': return productInSlot.bottleStock60ml;
      case '100ml': return productInSlot.bottleStock100ml;
      default: return 0;
    }
  };

  const [stockAmount, setStockAmount] = useState<string>(getCurrentStock()?.toString() || '0');

  // Get current price for the selected size
  const getCurrentPrice = () => {
    if (!productInSlot) return 0;
    switch (selectedBottleSize) {
      case '30ml': return productInSlot.price30ml || 2500;
      case '60ml': return productInSlot.price60ml || 4500;
      case '100ml': return productInSlot.price100ml || 6500;
      default: return 0;
    }
  };

  const updateProductSlotMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('PUT', `/api/admin/bottle-slots/${slotNumber}/assign`, { 
        productId: selectedProductId, 
        bottleSize: selectedBottleSize 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      onSlotUpdate();
      toast({
        title: "Success",
        description: "Product assigned to slot successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to assign product to slot",
        variant: "destructive",
      });
      console.error('Error assigning product to slot:', error);
    }
  });

  const updateBottleStockMutation = useMutation({
    mutationFn: async () => {
      if (!productInSlot) {
        throw new Error('No product assigned to this slot');
      }
      // Update the product's bottle stock for the selected size instead of bottle slot stock
      return apiRequest('PUT', `/api/admin/products/${productInSlot.id}/bottle-stock`, { 
        bottleSize: selectedBottleSize,
        quantity: parseInt(stockAmount) 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      onSlotUpdate();
      toast({
        title: "Success", 
        description: "Stock updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update stock",
        variant: "destructive",
      });
      console.error('Error updating stock:', error);
    }
  });

  const clearSlotMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('DELETE', `/api/admin/bottle-slots/${slotNumber}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      onSlotUpdate();
      toast({
        title: "Success",
        description: "Slot cleared successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error", 
        description: "Failed to clear slot",
        variant: "destructive",
      });
      console.error('Error clearing slot:', error);
    }
  });

  const handleAssignProduct = () => {
    if (selectedProductId) {
      updateProductSlotMutation.mutate();
    }
  };

  const handleUpdateStock = () => {
    if (productInSlot && stockAmount) {
      updateBottleStockMutation.mutate();
    }
  };

  const handleClearSlot = () => {
    if (productInSlot) {
      clearSlotMutation.mutate();
    }
  };

  const formatPrice = (priceInCents: number) => {
    return `₹${(priceInCents / 100).toFixed(2)}`;
  };

  return (
    <div className="space-y-2">
      {productInSlot ? (
        // Product is assigned to this slot
        <div className="space-y-2">
          {/* Current Assignment Display */}
          <div className="text-center py-2 bg-green-600/20 rounded">
            <img
              src={productInSlot.imageUrl}
              alt={productInSlot.name}
              className="w-8 h-8 object-cover rounded mx-auto mb-1"
            />
            <p className="text-white text-xs font-semibold">{productInSlot.name}</p>
            <p className="text-gray-300 text-xs">Assigned</p>
          </div>

          {/* Bottle Size Selection */}
          <select 
            className="bg-white/20 border-luxe-gold/30 text-white text-xs rounded px-1 py-1 w-full"
            value={selectedBottleSize}
            onChange={(e) => {
              const newSize = e.target.value as '30ml' | '60ml' | '100ml';
              setSelectedBottleSize(newSize);
              // Update stockAmount to show current stock for the new size
              const currentStock = productInSlot ? 
                (newSize === '30ml' ? productInSlot.bottleStock30ml :
                 newSize === '60ml' ? productInSlot.bottleStock60ml :
                 productInSlot.bottleStock100ml) : 0;
              setStockAmount(currentStock?.toString() || '0');
            }}
          >
            <option value="30ml" className="text-black">30ml - {formatPrice(productInSlot.price30ml || 2500)}</option>
            <option value="60ml" className="text-black">60ml - {formatPrice(productInSlot.price60ml || 4500)}</option>
            <option value="100ml" className="text-black">100ml - {formatPrice(productInSlot.price100ml || 6500)}</option>
          </select>

          {/* Current Stock Display */}
          <div className="bg-white/10 rounded px-2 py-1 text-center">
            <p className="text-xs text-gray-300">Current Stock</p>
            <p className="text-white font-bold">{getCurrentStock()}</p>
          </div>

          {/* Stock Update Input */}
          <div className="space-y-1">
            <label className="text-xs text-gray-300">New Stock:</label>
            <VirtualInput
              type="number"
              value={stockAmount}
              onChange={setStockAmount}
              className="bg-white/20 border-luxe-gold/30 text-white text-xs rounded px-1 py-1 w-full h-6"
              maxLength={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-1">
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white text-xs"
              onClick={handleUpdateStock}
              disabled={updateBottleStockMutation.isPending}
            >
              {updateBottleStockMutation.isPending ? 'Updating...' : 'Update Stock'}
            </Button>
            <Button
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white text-xs"
              onClick={handleClearSlot}
              disabled={clearSlotMutation.isPending}
            >
              {clearSlotMutation.isPending ? 'Clearing...' : 'Clear Slot'}
            </Button>
          </div>
        </div>
      ) : (
        // Empty slot - allow product assignment
        <div className="space-y-2">
          <div className="text-center space-y-2">
            <div className="w-8 h-8 bg-gray-600 rounded mx-auto flex items-center justify-center">
              <Package className="text-gray-400 h-4 w-4" />
            </div>
            <p className="text-gray-400 text-xs">Empty Slot</p>
          </div>

          {/* Fragrance Selection */}
          <select 
            className="bg-white/20 border-luxe-gold/30 text-white text-xs rounded px-1 py-1 w-full"
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(parseInt(e.target.value))}
          >
            <option value={0}>Select Fragrance</option>
            {products?.map(product => (
              <option key={product.id} value={product.id} className="text-black">
                {product.name}
              </option>
            ))}
          </select>

          {/* Bottle Size Selection for new assignment */}
          {selectedProductId > 0 && (
            <div className="space-y-1">
              <label className="text-xs text-gray-300">Bottle Size:</label>
              <select 
                className="bg-white/20 border-luxe-gold/30 text-white text-xs rounded px-1 py-1 w-full"
                value={selectedBottleSize}
                onChange={(e) => setSelectedBottleSize(e.target.value as '30ml' | '60ml' | '100ml')}
              >
                <option value="30ml" className="text-black">30ml Bottle</option>
                <option value="60ml" className="text-black">60ml Bottle</option>
                <option value="100ml" className="text-black">100ml Bottle</option>
              </select>
            </div>
          )}

          {/* Assign Button */}
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs w-full"
            onClick={handleAssignProduct}
            disabled={!selectedProductId || updateProductSlotMutation.isPending}
          >
            {updateProductSlotMutation.isPending ? 'Assigning...' : 'Assign Product'}
          </Button>
        </div>
      )}
    </div>
  );
}