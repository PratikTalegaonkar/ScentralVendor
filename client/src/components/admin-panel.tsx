import { useState } from 'react';
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
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: products, isLoading: productsLoading, refetch: refetchProducts } = useQuery<Product[]>({
    queryKey: ['/api/admin/products'],
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  const { data: orders, isLoading: ordersLoading, refetch: refetchOrders } = useQuery<Order[]>({
    queryKey: ['/api/admin/orders'],
    refetchOnMount: true,
    refetchOnWindowFocus: false,
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
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
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
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
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

  const handleUpdateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    updateProductMutation.mutate({
      id: editingProduct.id,
      data: {
        ...editingProduct,
        price: editingProduct.price
      }
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
    <div className="min-h-screen bg-gradient-to-br from-charcoal via-gray-900 to-black p-8 overflow-y-auto">
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
                              onClick={() => setEditingProduct(product)}
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
                                    src={productInSlot.imageUrl}
                                    alt={productInSlot.name}
                                    className="w-16 h-16 object-cover rounded mx-auto mb-2"
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
                                  const formData = new FormData(e.target as HTMLFormElement);
                                  const quantity = parseInt(formData.get('sprayStock') as string);
                                  updateSprayStockMutation.mutate({ productId: productInSlot.id, quantity });
                                }} className="space-y-2">
                                  <VirtualInputLogin
                                    value={productInSlot.sprayStock.toString()}
                                    onChange={(value) => {
                                      const input = document.querySelector(`input[data-product-id="spray-${productInSlot.id}"]`) as HTMLInputElement;
                                      if (input) input.value = value;
                                    }}
                                    className="bg-white/20 border-luxe-gold/30 text-white text-sm h-8 w-full"
                                    placeholder="Stock"
                                    maxLength={4}
                                  />
                                  <input type="hidden" name="sprayStock" data-product-id={`spray-${productInSlot.id}`} defaultValue={productInSlot.sprayStock} />
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
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                      {Array.from({ length: 15 }, (_, slotIndex) => {
                        const slotNumber = slotIndex + 1;
                        const productInSlot = products?.find(p => p.bottleSlot === slotNumber);
                        
                        return (
                          <div key={slotNumber} className="bg-white/10 rounded-lg p-3 border-2 border-luxe-gold/30">
                            <div className="text-center mb-3">
                              <h4 className="text-luxe-gold font-bold text-sm">Slot {slotNumber}</h4>
                            </div>
                            
                            <div className="space-y-2">
                              {/* Fragrance Selection */}
                              <select 
                                className="bg-white/20 border-luxe-gold/30 text-white text-xs rounded px-1 py-1 w-full"
                                defaultValue={productInSlot?.id || ""}
                                onChange={(e) => {
                                  const productId = parseInt(e.target.value);
                                  if (productId) {
                                    updateProductSlotMutation.mutate({ productId, slotType: 'bottle', slotNumber });
                                  }
                                }}
                              >
                                <option value="">Select Fragrance</option>
                                {products?.map(product => (
                                  <option key={product.id} value={product.id} className="text-black">
                                    {product.name}
                                  </option>
                                ))}
                              </select>
                              
                              {/* Bottle Size Selection */}
                              <select 
                                className="bg-white/20 border-luxe-gold/30 text-white text-xs rounded px-1 py-1 w-full"
                                defaultValue="30ml"
                              >
                                <option value="30ml" className="text-black">30ml Bottle</option>
                                <option value="60ml" className="text-black">60ml Bottle</option>
                                <option value="100ml" className="text-black">100ml Bottle</option>
                              </select>
                              
                              {/* Stock Input */}
                              <div className="space-y-1">
                                <label className="text-xs text-gray-300">Stock:</label>
                                <VirtualInput
                                  type="number"
                                  value="0"
                                  onChange={(value: string) => {
                                    // Stock will be managed per slot
                                  }}
                                  className="bg-white/20 border-luxe-gold/30 text-white text-xs rounded px-1 py-1 w-full h-6"
                                  maxLength={3}
                                />
                              </div>
                              
                              {/* Current Assignment Display */}
                              {productInSlot && (
                                <div className="text-center py-2 bg-green-600/20 rounded">
                                  <img
                                    src={productInSlot.imageUrl}
                                    alt={productInSlot.name}
                                    className="w-8 h-8 object-cover rounded mx-auto mb-1"
                                  />
                                  <p className="text-white text-xs font-semibold">{productInSlot.name}</p>
                                  <p className="text-gray-300 text-xs">Assigned</p>
                                </div>
                              )}
                              
                              {/* Action Buttons */}
                              <div className="grid grid-cols-2 gap-1">
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 text-white text-xs"
                                  onClick={() => {
                                    // Save slot assignment
                                  }}
                                >
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  className="bg-red-600 hover:bg-red-700 text-white text-xs"
                                  onClick={() => {
                                    // Clear slot assignment
                                  }}
                                >
                                  Clear
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
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
        {editingProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="bg-white/95 backdrop-blur-sm w-full max-w-md">
              <CardHeader>
                <CardTitle className="text-charcoal">Edit Product</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProduct} className="space-y-4">
                  <div>
                    <Label htmlFor="edit-name">Product Name</Label>
                    <VirtualInput
                      id="edit-name"
                      type="text"
                      value={editingProduct.name}
                      onChange={(value: string) => setEditingProduct({ ...editingProduct, name: value })}
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
                        value={Math.round(editingProduct.price / 100).toString()}
                        onChange={(value: string) => setEditingProduct({ ...editingProduct, price: parseInt(value || '0') * 100 })}
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
                          value={Math.round((editingProduct.price30ml || 2500) / 100).toString()}
                          onChange={(value: string) => setEditingProduct({ ...editingProduct, price30ml: parseInt(value || '0') * 100 })}
                          className="h-10 text-base"
                          maxLength={10}
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-price-60ml">60ml Bottle (₹)</Label>
                        <VirtualInput
                          id="edit-price-60ml"
                          type="number"
                          value={Math.round((editingProduct.price60ml || 4500) / 100).toString()}
                          onChange={(value: string) => setEditingProduct({ ...editingProduct, price60ml: parseInt(value || '0') * 100 })}
                          className="h-10 text-base"
                          maxLength={10}
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-price-100ml">100ml Bottle (₹)</Label>
                        <VirtualInput
                          id="edit-price-100ml"
                          type="number"
                          value={Math.round((editingProduct.price100ml || 6500) / 100).toString()}
                          onChange={(value: string) => setEditingProduct({ ...editingProduct, price100ml: parseInt(value || '0') * 100 })}
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
                      value={editingProduct.description}
                      onChange={(value: string) => setEditingProduct({ ...editingProduct, description: value })}
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
                      value={editingProduct.imageUrl}
                      onChange={(value: string) => setEditingProduct({ ...editingProduct, imageUrl: value })}
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
                        value={editingProduct.sprayStock?.toString() || '0'}
                        onChange={(value: string) => setEditingProduct({ ...editingProduct, sprayStock: parseInt(value || '0') })}
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
                          value={editingProduct.bottleStock30ml?.toString() || '0'}
                          onChange={(value: string) => setEditingProduct({ ...editingProduct, bottleStock30ml: parseInt(value || '0') })}
                          className="h-10 text-base"
                          maxLength={4}
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-bottle-60ml">60ml Bottles</Label>
                        <VirtualInput
                          id="edit-bottle-60ml"
                          type="number"
                          value={editingProduct.bottleStock60ml?.toString() || '0'}
                          onChange={(value: string) => setEditingProduct({ ...editingProduct, bottleStock60ml: parseInt(value || '0') })}
                          className="h-10 text-base"
                          maxLength={4}
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-bottle-100ml">100ml Bottles</Label>
                        <VirtualInput
                          id="edit-bottle-100ml"
                          type="number"
                          value={editingProduct.bottleStock100ml?.toString() || '0'}
                          onChange={(value: string) => setEditingProduct({ ...editingProduct, bottleStock100ml: parseInt(value || '0') })}
                          className="h-10 text-base"
                          maxLength={4}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={editingProduct.available}
                      onCheckedChange={(checked) => setEditingProduct({ ...editingProduct, available: checked })}
                    />
                    <Label>Available for purchase</Label>
                  </div>
                  <div className="flex space-x-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setEditingProduct(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-luxe-gold hover:bg-yellow-600 text-charcoal"
                      disabled={updateProductMutation.isPending}
                    >
                      {updateProductMutation.isPending ? 'Updating...' : 'Update'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </motion.div>
    </div>
  );
}