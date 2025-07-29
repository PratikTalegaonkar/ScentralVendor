import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import VirtualInputLogin from '@/components/ui/virtual-input-login';
import VirtualInput from '@/components/ui/virtual-input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut, Package, Database, Plus, Edit3, Trash2, RefreshCw } from 'lucide-react';
import HeatmapDisplay from './heatmap-display';
import BottleSlotManager from './bottle-slot-manager';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { Product, Order } from '@shared/schema';

interface AdminPanelProps {
  onLogout: () => void;
}

export default function AdminPanel({ onLogout }: AdminPanelProps) {
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    price30ml: '25',
    price60ml: '45', 
    price100ml: '65',
    imageUrl: '',
    available: true
  });
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editFormData, setEditFormData] = useState<any>(null);
  const [isManualEdit, setIsManualEdit] = useState(false);
  const [sprayStockValues, setSprayStockValues] = useState<{[key: number]: string}>({});
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: products, isLoading: productsLoading, refetch: refetchProducts } = useQuery<Product[]>({
    queryKey: ['/api/admin/products'],
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    refetchInterval: 5000, // Refresh every 5 seconds to catch updates
  });

  const { data: orders, isLoading: ordersLoading, refetch: refetchOrders } = useQuery<Order[]>({
    queryKey: ['/api/admin/orders'],
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    refetchInterval: 5000, // Refresh every 5 seconds to catch updates
  });

  const createProductMutation = useMutation({
    mutationFn: async (productData: any) => {
      const response = await apiRequest('POST', '/api/admin/products', productData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Product created successfully",
      });
      setNewProduct({ name: '', description: '', price: '', price30ml: '25', price60ml: '45', price100ml: '65', imageUrl: '', available: true });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create product",
        variant: "destructive",
      });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest('PUT', `/api/admin/products/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Product updated successfully",
      });
      setEditingProduct(null);
      setEditFormData(null);
      setIsManualEdit(false);
      // Invalidate all related caches
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/heatmap'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update product",
        variant: "destructive",
      });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/admin/products/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
      // Invalidate all related caches
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/heatmap'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      });
    },
  });

  const updateSprayStockMutation = useMutation({
    mutationFn: async ({ productId, quantity }: { productId: number; quantity: number }) => {
      const response = await apiRequest('PUT', `/api/admin/products/${productId}/spray-stock`, { quantity });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Spray stock updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update spray stock",
        variant: "destructive",
      });
    },
  });

  const updateBottleStockMutation = useMutation({
    mutationFn: async ({ productId, bottleSize, quantity }: { productId: number; bottleSize: string; quantity: number }) => {
      const response = await apiRequest('PUT', `/api/admin/products/${productId}/bottle-stock`, { bottleSize, quantity });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Bottle stock updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update bottle stock",
        variant: "destructive",
      });
    },
  });

  const updateProductSlotMutation = useMutation({
    mutationFn: async ({ productId, slotType, slotNumber }: { productId: number; slotType: 'spray' | 'bottle'; slotNumber: number }) => {
      const response = await apiRequest('PUT', `/api/admin/products/${productId}/slot`, { slotType, slotNumber });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Product slot assigned successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to assign product slot",
        variant: "destructive",
      });
    },
  });

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Only validate on form submission
    if (!newProduct.name?.trim() || !newProduct.description?.trim() || !newProduct.price?.trim()) {
      // Silently prevent submission without showing error
      return;
    }

    const priceValue = parseFloat(newProduct.price);
    if (isNaN(priceValue) || priceValue <= 0) {
      // Silently prevent submission without showing error
      return;
    }

    createProductMutation.mutate({
      ...newProduct,
      name: newProduct.name.trim(),
      description: newProduct.description.trim(),
      imageUrl: newProduct.imageUrl?.trim() || '',
      price: Math.round(priceValue * 100), // Convert to cents
      price30ml: Math.round(parseFloat(newProduct.price30ml) * 100), // Convert to cents
      price60ml: Math.round(parseFloat(newProduct.price60ml) * 100), // Convert to cents
      price100ml: Math.round(parseFloat(newProduct.price100ml) * 100), // Convert to cents
    });
  };

  const startEditing = (product: Product) => {
    setEditFormData({
      id: product.id,
      name: product.name,
      description: product.description,
      imageUrl: product.imageUrl,
      price: product.price,
      price30ml: product.price30ml || 2500,
      price60ml: product.price60ml || 4500, 
      price100ml: product.price100ml || 6500,
      sprayStock: product.sprayStock,
      bottleStock30ml: product.bottleStock30ml,
      bottleStock60ml: product.bottleStock60ml,
      bottleStock100ml: product.bottleStock100ml,
      available: product.available
    });
    setEditingProduct(product);
    setIsManualEdit(true);
  };

  const handleUpdateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData) return;

    // Only allow updates when explicitly clicked, not on every keystroke
    updateProductMutation.mutate({
      id: editFormData.id,
      data: editFormData
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    onLogout();
  };

  const formatPrice = (priceInCents: number) => {
    return `₹${(priceInCents / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-charcoal via-gray-900 to-black overflow-y-auto">
      <div className="p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="font-serif text-4xl font-bold text-white mb-2">
              <span className="text-luxe-gold">SCENTRA</span> Admin Panel
            </h1>
            <p className="text-platinum">Manage your vending machine inventory and orders</p>
          </div>
          <div className="flex space-x-3">
            <Button
              onClick={() => {
                refetchProducts();
                refetchOrders();
                toast({
                  title: "Refreshed",
                  description: "Data has been updated",
                });
              }}
              variant="outline"
              className="bg-luxe-gold/20 hover:bg-luxe-gold/30 text-luxe-gold border-luxe-gold/50"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="bg-red-600 hover:bg-red-700 text-white border-red-600"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="bg-white/10 backdrop-blur-sm border-luxe-gold/30">
            <TabsTrigger value="products" className="text-white data-[state=active]:bg-luxe-gold data-[state=active]:text-charcoal">
              <Package className="mr-2 h-4 w-4" />
              Product Management
            </TabsTrigger>
            <TabsTrigger value="inventory" className="text-white data-[state=active]:bg-luxe-gold data-[state=active]:text-charcoal">
              <Database className="mr-2 h-4 w-4" />
              Inventory Management
            </TabsTrigger>
            <TabsTrigger value="orders" className="text-white data-[state=active]:bg-luxe-gold data-[state=active]:text-charcoal">
              <Database className="mr-2 h-4 w-4" />
              Order Database
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-6">
            {/* Add New Product */}
            <Card className="bg-white/10 backdrop-blur-sm border-luxe-gold/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Plus className="mr-2 h-5 w-5 text-luxe-gold" />
                  Add New Product
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateProduct} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name" className="text-white">Product Name</Label>
                    <VirtualInputLogin
                      id="name"
                      value={newProduct.name}
                      onChange={(value) => setNewProduct({ ...newProduct, name: value })}
                      className="bg-white/20 border-luxe-gold/30 text-white placeholder:text-gray-400 h-12 text-lg"
                      placeholder="e.g., Midnight Rose"
                      maxLength={100}
                    />
                  </div>
                  {/* Pricing Section */}
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="price" className="text-white">Spray Price (₹)</Label>
                      <VirtualInputLogin
                        id="price"
                        value={newProduct.price}
                        onChange={(value) => setNewProduct({ ...newProduct, price: value })}
                        className="bg-white/20 border-luxe-gold/30 text-white placeholder:text-gray-400 h-12 text-lg"
                        placeholder="1500"
                        maxLength={10}
                      />
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label htmlFor="price-30ml" className="text-white">30ml Bottle (₹)</Label>
                        <VirtualInputLogin
                          id="price-30ml"
                          value={newProduct.price30ml}
                          onChange={(value) => setNewProduct({ ...newProduct, price30ml: value })}
                          className="bg-white/20 border-luxe-gold/30 text-white placeholder:text-gray-400 h-10 text-base"
                          placeholder="25"
                          maxLength={10}
                        />
                      </div>
                      <div>
                        <Label htmlFor="price-60ml" className="text-white">60ml Bottle (₹)</Label>
                        <VirtualInputLogin
                          id="price-60ml"
                          value={newProduct.price60ml}
                          onChange={(value) => setNewProduct({ ...newProduct, price60ml: value })}
                          className="bg-white/20 border-luxe-gold/30 text-white placeholder:text-gray-400 h-10 text-base"
                          placeholder="45"
                          maxLength={10}
                        />
                      </div>
                      <div>
                        <Label htmlFor="price-100ml" className="text-white">100ml Bottle (₹)</Label>
                        <VirtualInputLogin
                          id="price-100ml"
                          value={newProduct.price100ml}
                          onChange={(value) => setNewProduct({ ...newProduct, price100ml: value })}
                          className="bg-white/20 border-luxe-gold/30 text-white placeholder:text-gray-400 h-10 text-base"
                          placeholder="65"
                          maxLength={10}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="description" className="text-white">Description</Label>
                    <VirtualInputLogin
                      id="description"
                      value={newProduct.description}
                      onChange={(value) => setNewProduct({ ...newProduct, description: value })}
                      className="bg-white/20 border-luxe-gold/30 text-white placeholder:text-gray-400 min-h-24 text-lg"
                      placeholder="Elegant and sophisticated fragrance..."
                      maxLength={500}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="imageUrl" className="text-white">Image URL</Label>
                    <VirtualInputLogin
                      id="imageUrl"
                      value={newProduct.imageUrl}
                      onChange={(value) => setNewProduct({ ...newProduct, imageUrl: value })}
                      className="bg-white/20 border-luxe-gold/30 text-white placeholder:text-gray-400 h-12 text-lg"
                      placeholder="https://images.unsplash.com/..."
                      maxLength={500}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="available"
                      checked={newProduct.available}
                      onCheckedChange={(checked) => setNewProduct({ ...newProduct, available: checked })}
                    />
                    <Label htmlFor="available" className="text-white">Available for purchase</Label>
                  </div>
                  <div className="md:col-span-2">
                    <Button
                      type="submit"
                      className="bg-luxe-gold hover:bg-yellow-600 text-charcoal"
                      disabled={createProductMutation.isPending}
                    >
                      {createProductMutation.isPending ? 'Creating...' : 'Create Product'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Products List */}
            <Card className="bg-white/10 backdrop-blur-sm border-luxe-gold/50">
              <CardHeader>
                <CardTitle className="text-white">Current Products</CardTitle>
              </CardHeader>
              <CardContent>
                {productsLoading ? (
                  <div className="text-white">Loading products...</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {products?.map((product) => (
                      <div key={product.id} className="bg-white/20 rounded-lg p-4 border border-luxe-gold/30">
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-32 object-cover rounded-lg mb-3"
                        />
                        <h3 className="text-white font-semibold mb-1">{product.name}</h3>
                        <p className="text-platinum text-sm mb-2">{product.description}</p>
                        <div className="space-y-1 mb-3">
                          <p className="text-luxe-gold font-bold">Spray: {formatPrice(product.price)}</p>
                          <div className="text-sm text-gray-300">
                            <p>30ml: {formatPrice(product.price30ml || 2500)}</p>
                            <p>60ml: {formatPrice(product.price60ml || 4500)}</p>
                            <p>100ml: {formatPrice(product.price100ml || 6500)}</p>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className={`text-xs px-2 py-1 rounded ${
                            product.available ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                          }`}>
                            {product.available ? 'Available' : 'Unavailable'}
                          </span>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                              onClick={() => startEditing(product)}
                            >
                              <Edit3 className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-red-600 hover:bg-red-700 text-white border-red-600"
                              onClick={() => deleteProductMutation.mutate(product.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inventory" className="space-y-6">
            {/* Real-time Heatmap Display */}
            <HeatmapDisplay />
            
            <div className="grid grid-cols-1 gap-6">
              {/* Spray Slot Management (Slots 1-5) */}
              <Card className="bg-white/10 backdrop-blur-sm border-luxe-gold/50">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Database className="mr-2 h-5 w-5 text-luxe-gold" />
                    Spray Slot Management (Slots 1-5)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {productsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin w-8 h-8 border-4 border-luxe-gold border-t-transparent rounded-full mx-auto mb-4"></div>
                      <p className="text-platinum">Loading inventory...</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      {Array.from({ length: 5 }, (_, slotIndex) => {
                        const slotNumber = slotIndex + 1;
                        const productInSlot = products?.find(p => p.spraySlot === slotNumber);
                        
                        return (
                          <div key={slotNumber} className="bg-white/10 rounded-lg p-4 border-2 border-luxe-gold/30">
                            <div className="text-center mb-3">
                              <h4 className="text-luxe-gold font-bold text-lg">Slot {slotNumber}</h4>
                            </div>
                            
                            {productInSlot ? (
                              <div className="space-y-3">
                                <div className="text-center">
                                  <img
                                    src={productInSlot.imageUrl || 'https://via.placeholder.com/64x64/374151/9CA3AF?text=No+Image'}
                                    alt={productInSlot.name}
                                    className="w-16 h-16 object-cover rounded mx-auto mb-2"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.src = 'https://via.placeholder.com/64x64/374151/9CA3AF?text=No+Image';
                                    }}
                                  />
                                  <h5 className="text-white font-semibold text-sm">{productInSlot.name}</h5>
                                  <p className="text-gray-400 text-xs">Stock: {productInSlot.sprayStock}</p>
                                </div>
                                
                                <div className={`px-2 py-1 rounded text-xs text-center ${
                                  productInSlot.sprayStock > 50 ? 'bg-green-600' :
                                  productInSlot.sprayStock > 20 ? 'bg-yellow-600' : 'bg-red-600'
                                }`}>
                                  {productInSlot.sprayStock > 50 ? 'Well Stocked' :
                                   productInSlot.sprayStock > 20 ? 'Low Stock' : 'Critical'}
                                </div>
                                
                                <form onSubmit={(e) => {
                                  e.preventDefault();
                                  const quantity = parseInt(sprayStockValues[productInSlot.id] || productInSlot.sprayStock.toString());
                                  if (!isNaN(quantity)) {
                                    updateSprayStockMutation.mutate({ productId: productInSlot.id, quantity });
                                  }
                                }} className="space-y-2">
                                  <VirtualInputLogin
                                    value={sprayStockValues[productInSlot.id] || productInSlot.sprayStock.toString()}
                                    onChange={(value) => {
                                      // Only update local state, no auto-submit
                                      setSprayStockValues(prev => ({
                                        ...prev,
                                        [productInSlot.id]: value
                                      }));
                                    }}
                                    className="bg-white/20 border-luxe-gold/30 text-white text-sm h-8 w-full"
                                    placeholder="Stock"
                                    maxLength={4}
                                  />
                                  <Button
                                    type="submit"
                                    size="sm"
                                    className="bg-luxe-gold hover:bg-yellow-600 text-charcoal w-full text-xs"
                                    disabled={updateSprayStockMutation.isPending}
                                  >
                                    Update Stock
                                  </Button>
                                </form>
                              </div>
                            ) : (
                              <div className="text-center space-y-3">
                                <div className="w-16 h-16 bg-gray-600 rounded mx-auto flex items-center justify-center">
                                  <Package className="text-gray-400 h-8 w-8" />
                                </div>
                                <p className="text-gray-400 text-sm">Empty Slot</p>
                                <select 
                                  className="bg-white/20 border-luxe-gold/30 text-white text-sm rounded px-2 py-1 w-full"
                                  onChange={(e) => {
                                    const productId = parseInt(e.target.value);
                                    if (productId) {
                                      updateProductSlotMutation.mutate({ productId, slotType: 'spray', slotNumber });
                                    }
                                  }}
                                >
                                  <option value="">Assign Product</option>
                                  {products?.filter(p => !p.spraySlot).map(product => (
                                    <option key={product.id} value={product.id} className="text-black">
                                      {product.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Bottle Slot Management (Slots 1-15) */}
              <Card className="bg-white/10 backdrop-blur-sm border-luxe-gold/50">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Package className="mr-2 h-5 w-5 text-luxe-gold" />
                    Bottle Slot Management (Slots 1-15)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {productsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin w-8 h-8 border-4 border-luxe-gold border-t-transparent rounded-full mx-auto mb-4"></div>
                      <p className="text-platinum">Loading inventory...</p>
                    </div>
                  ) : (
                    <div className="max-h-[600px] overflow-y-auto pr-2">
                      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {Array.from({ length: 15 }, (_, slotIndex) => {
                          const slotNumber = slotIndex + 1;
                          const productInSlot = products?.find(p => p.bottleSlot === slotNumber);
                          
                          return (
                            <div key={slotNumber} className="bg-white/10 rounded-lg p-3 border-2 border-luxe-gold/30">
                              <div className="text-center mb-3">
                                <h4 className="text-luxe-gold font-bold text-sm">Slot {slotNumber}</h4>
                              </div>
                              
                              <BottleSlotManager 
                                slotNumber={slotNumber}
                                products={products || []}
                                productInSlot={productInSlot}
                                onSlotUpdate={() => {
                                  // Refresh products data
                                  refetchProducts();
                                }}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
            <Card className="bg-white/10 backdrop-blur-sm border-luxe-gold/50">
              <CardHeader>
                <CardTitle className="text-white">Order History</CardTitle>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div className="text-white">Loading orders...</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-white">
                      <thead>
                        <tr className="border-b border-luxe-gold/30">
                          <th className="text-left py-2">Order ID</th>
                          <th className="text-left py-2">Product ID</th>
                          <th className="text-left py-2">Payment Method</th>
                          <th className="text-left py-2">Amount</th>
                          <th className="text-left py-2">Status</th>
                          <th className="text-left py-2">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders?.map((order) => (
                          <tr key={order.id} className="border-b border-gray-700">
                            <td className="py-2">#{order.id}</td>
                            <td className="py-2">{order.productId}</td>
                            <td className="py-2 capitalize">{order.paymentMethod}</td>
                            <td className="py-2 text-luxe-gold">{formatPrice(order.amount)}</td>
                            <td className="py-2">
                              <span className={`px-2 py-1 rounded text-xs ${
                                order.status === 'completed' ? 'bg-green-600' :
                                order.status === 'pending' ? 'bg-yellow-600' : 'bg-red-600'
                              }`}>
                                {order.status}
                              </span>
                            </td>
                            <td className="py-2 text-sm">{formatDate(order.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Product Modal */}
        {editingProduct && editFormData && (
          <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm z-40 flex items-start justify-center p-4 overflow-y-auto">
            <Card className="bg-white/95 backdrop-blur-sm w-full max-w-md my-8 max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle className="text-charcoal">Edit Product</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="edit-name">Product Name</Label>
                    <VirtualInput
                      id="edit-name"
                      type="text"
                      value={editFormData.name}
                      onChange={(value: string) => setEditFormData({ ...editFormData, name: value })}
                      className="h-12 text-lg"
                      maxLength={100}
                    />
                  </div>
                  {/* Pricing Section */}
                  <div className="space-y-4 border-t pt-4">
                    <h4 className="text-charcoal font-semibold mb-3">Pricing Management</h4>
                    
                    <div>
                      <Label htmlFor="edit-spray-price">Spray Price (₹)</Label>
                      <VirtualInput
                        id="edit-spray-price"
                        type="number"
                        value={Math.round(editFormData.price / 100).toString()}
                        onChange={(value: string) => setEditFormData({ ...editFormData, price: parseInt(value || '0') * 100 })}
                        className="h-12 text-lg"
                        maxLength={10}
                      />
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label htmlFor="edit-price-30ml">30ml Bottle (₹)</Label>
                        <VirtualInput
                          id="edit-price-30ml"
                          type="number"
                          value={Math.round((editFormData.price30ml || 2500) / 100).toString()}
                          onChange={(value: string) => setEditFormData({ ...editFormData, price30ml: parseInt(value || '0') * 100 })}
                          className="h-10 text-base"
                          maxLength={10}
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-price-60ml">60ml Bottle (₹)</Label>
                        <VirtualInput
                          id="edit-price-60ml"
                          type="number"
                          value={Math.round((editFormData.price60ml || 4500) / 100).toString()}
                          onChange={(value: string) => setEditFormData({ ...editFormData, price60ml: parseInt(value || '0') * 100 })}
                          className="h-10 text-base"
                          maxLength={10}
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-price-100ml">100ml Bottle (₹)</Label>
                        <VirtualInput
                          id="edit-price-100ml"
                          type="number"
                          value={Math.round((editFormData.price100ml || 6500) / 100).toString()}
                          onChange={(value: string) => setEditFormData({ ...editFormData, price100ml: parseInt(value || '0') * 100 })}
                          className="h-10 text-base"
                          maxLength={10}
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="edit-description">Description</Label>
                    <VirtualInput
                      id="edit-description"
                      type="textarea"
                      value={editFormData.description}
                      onChange={(value: string) => setEditFormData({ ...editFormData, description: value })}
                      className="min-h-20 text-lg"
                      maxLength={500}
                      rows={4}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-imageUrl">Image URL</Label>
                    <VirtualInput
                      id="edit-imageUrl"
                      type="text"
                      value={editFormData.imageUrl}
                      onChange={(value: string) => setEditFormData({ ...editFormData, imageUrl: value })}
                      className="h-12 text-lg"
                      inputMode="url"
                      maxLength={500}
                    />
                  </div>
                  
                  {/* Stock Management Section */}
                  <div className="border-t pt-4">
                    <h4 className="text-charcoal font-semibold mb-3">Stock Management</h4>
                    
                    {/* Spray Stock */}
                    <div className="mb-4">
                      <Label htmlFor="edit-spray-stock">Spray Stock</Label>
                      <VirtualInput
                        id="edit-spray-stock"
                        type="number"
                        value={editFormData.sprayStock?.toString() || '0'}
                        onChange={(value: string) => setEditFormData({ ...editFormData, sprayStock: parseInt(value || '0') })}
                        className="h-10 text-base"
                        maxLength={4}
                      />
                    </div>
                    
                    {/* Bottle Stock */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div>
                        <Label htmlFor="edit-bottle-30ml">30ml Bottles</Label>
                        <VirtualInput
                          id="edit-bottle-30ml"
                          type="number"
                          value={editFormData.bottleStock30ml?.toString() || '0'}
                          onChange={(value: string) => setEditFormData({ ...editFormData, bottleStock30ml: parseInt(value || '0') })}
                          className="h-10 text-base"
                          maxLength={4}
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-bottle-60ml">60ml Bottles</Label>
                        <VirtualInput
                          id="edit-bottle-60ml"
                          type="number"
                          value={editFormData.bottleStock60ml?.toString() || '0'}
                          onChange={(value: string) => setEditFormData({ ...editFormData, bottleStock60ml: parseInt(value || '0') })}
                          className="h-10 text-base"
                          maxLength={4}
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-bottle-100ml">100ml Bottles</Label>
                        <VirtualInput
                          id="edit-bottle-100ml"
                          type="number"
                          value={editFormData.bottleStock100ml?.toString() || '0'}
                          onChange={(value: string) => setEditFormData({ ...editFormData, bottleStock100ml: parseInt(value || '0') })}
                          className="h-10 text-base"
                          maxLength={4}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={editFormData.available}
                      onCheckedChange={(checked) => setEditFormData({ ...editFormData, available: checked })}
                    />
                    <Label>Available for purchase</Label>
                  </div>
                  <div className="flex space-x-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setEditingProduct(null);
                        setEditFormData(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={(e) => handleUpdateProduct(e)}
                      className="flex-1 bg-luxe-gold hover:bg-yellow-600 text-charcoal"
                      disabled={updateProductMutation.isPending}
                    >
                      {updateProductMutation.isPending ? 'Updating...' : 'Update'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </motion.div>
      </div>
    </div>
  );
}