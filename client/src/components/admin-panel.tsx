import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut, Package, Database, Plus, Edit3, Trash2, RefreshCw } from 'lucide-react';
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
      setNewProduct({ name: '', description: '', price: '', imageUrl: '', available: true });
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

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.description || !newProduct.price || !newProduct.imageUrl) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    createProductMutation.mutate({
      ...newProduct,
      price: parseInt(newProduct.price) * 100, // Convert to paise (cents equivalent for INR)
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
                    <Input
                      id="name"
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                      className="bg-white/20 border-luxe-gold/30 text-white placeholder:text-gray-400"
                      placeholder="e.g., Midnight Rose"
                    />
                  </div>
                  <div>
                    <Label htmlFor="price" className="text-white">Price (₹)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="1"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                      className="bg-white/20 border-luxe-gold/30 text-white placeholder:text-gray-400"
                      placeholder="1500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="description" className="text-white">Description</Label>
                    <Textarea
                      id="description"
                      value={newProduct.description}
                      onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                      className="bg-white/20 border-luxe-gold/30 text-white placeholder:text-gray-400"
                      placeholder="Elegant and sophisticated fragrance..."
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="imageUrl" className="text-white">Image URL</Label>
                    <Input
                      id="imageUrl"
                      value={newProduct.imageUrl}
                      onChange={(e) => setNewProduct({ ...newProduct, imageUrl: e.target.value })}
                      className="bg-white/20 border-luxe-gold/30 text-white placeholder:text-gray-400"
                      placeholder="https://images.unsplash.com/..."
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
                        <p className="text-luxe-gold font-bold mb-3">{formatPrice(product.price)}</p>
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Vending Machine Spray Stock */}
              <Card className="bg-white/10 backdrop-blur-sm border-luxe-gold/50">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Database className="mr-2 h-5 w-5 text-luxe-gold" />
                    Vending Machine Spray Stock
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {productsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin w-8 h-8 border-4 border-luxe-gold border-t-transparent rounded-full mx-auto mb-4"></div>
                      <p className="text-platinum">Loading inventory...</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {products?.map((product) => (
                        <div key={product.id} className="bg-white/10 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="text-white font-semibold">{product.name}</h4>
                              <p className="text-gray-400 text-sm">Current: {product.sprayStock} sprays</p>
                            </div>
                            <div className={`px-2 py-1 rounded text-xs ${
                              product.sprayStock > 50 ? 'bg-green-600' :
                              product.sprayStock > 20 ? 'bg-yellow-600' : 'bg-red-600'
                            }`}>
                              {product.sprayStock > 50 ? 'Well Stocked' :
                               product.sprayStock > 20 ? 'Low Stock' : 'Critical'}
                            </div>
                          </div>
                          <form onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.target as HTMLFormElement);
                            const quantity = parseInt(formData.get('sprayStock') as string);
                            updateSprayStockMutation.mutate({ productId: product.id, quantity });
                          }} className="flex gap-2">
                            <Input
                              name="sprayStock"
                              type="number"
                              min="0"
                              defaultValue={product.sprayStock}
                              className="bg-white/20 border-luxe-gold/30 text-white flex-1"
                              placeholder="New quantity"
                            />
                            <Button
                              type="submit"
                              size="sm"
                              className="bg-luxe-gold hover:bg-yellow-600 text-charcoal"
                              disabled={updateSprayStockMutation.isPending}
                            >
                              Update
                            </Button>
                          </form>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Bottle Collection Stock */}
              <Card className="bg-white/10 backdrop-blur-sm border-luxe-gold/50">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Package className="mr-2 h-5 w-5 text-luxe-gold" />
                    Bottle Collection Stock
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {productsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin w-8 h-8 border-4 border-luxe-gold border-t-transparent rounded-full mx-auto mb-4"></div>
                      <p className="text-platinum">Loading inventory...</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {products?.map((product) => (
                        <div key={product.id} className="bg-white/10 rounded-lg p-4">
                          <h4 className="text-white font-semibold mb-4">{product.name}</h4>
                          
                          {/* 30ml Bottles */}
                          <div className="mb-4">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-gray-300 text-sm">30ml Bottles</span>
                              <span className="text-luxe-gold text-sm">{product.bottleStock30ml} units</span>
                            </div>
                            <form onSubmit={(e) => {
                              e.preventDefault();
                              const formData = new FormData(e.target as HTMLFormElement);
                              const quantity = parseInt(formData.get('quantity') as string);
                              updateBottleStockMutation.mutate({ productId: product.id, bottleSize: '30ml', quantity });
                            }} className="flex gap-2">
                              <Input
                                name="quantity"
                                type="number"
                                min="0"
                                defaultValue={product.bottleStock30ml}
                                className="bg-white/20 border-luxe-gold/30 text-white text-sm h-8"
                                placeholder="Qty"
                              />
                              <Button
                                type="submit"
                                size="sm"
                                className="bg-luxe-gold hover:bg-yellow-600 text-charcoal h-8 px-3 text-xs"
                                disabled={updateBottleStockMutation.isPending}
                              >
                                Update
                              </Button>
                            </form>
                          </div>

                          {/* 60ml Bottles */}
                          <div className="mb-4">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-gray-300 text-sm">60ml Bottles</span>
                              <span className="text-luxe-gold text-sm">{product.bottleStock60ml} units</span>
                            </div>
                            <form onSubmit={(e) => {
                              e.preventDefault();
                              const formData = new FormData(e.target as HTMLFormElement);
                              const quantity = parseInt(formData.get('quantity') as string);
                              updateBottleStockMutation.mutate({ productId: product.id, bottleSize: '60ml', quantity });
                            }} className="flex gap-2">
                              <Input
                                name="quantity"
                                type="number"
                                min="0"
                                defaultValue={product.bottleStock60ml}
                                className="bg-white/20 border-luxe-gold/30 text-white text-sm h-8"
                                placeholder="Qty"
                              />
                              <Button
                                type="submit"
                                size="sm"
                                className="bg-luxe-gold hover:bg-yellow-600 text-charcoal h-8 px-3 text-xs"
                                disabled={updateBottleStockMutation.isPending}
                              >
                                Update
                              </Button>
                            </form>
                          </div>

                          {/* 100ml Bottles */}
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-gray-300 text-sm">100ml Bottles</span>
                              <span className="text-luxe-gold text-sm">{product.bottleStock100ml} units</span>
                            </div>
                            <form onSubmit={(e) => {
                              e.preventDefault();
                              const formData = new FormData(e.target as HTMLFormElement);
                              const quantity = parseInt(formData.get('quantity') as string);
                              updateBottleStockMutation.mutate({ productId: product.id, bottleSize: '100ml', quantity });
                            }} className="flex gap-2">
                              <Input
                                name="quantity"
                                type="number"
                                min="0"
                                defaultValue={product.bottleStock100ml}
                                className="bg-white/20 border-luxe-gold/30 text-white text-sm h-8"
                                placeholder="Qty"
                              />
                              <Button
                                type="submit"
                                size="sm"
                                className="bg-luxe-gold hover:bg-yellow-600 text-charcoal h-8 px-3 text-xs"
                                disabled={updateBottleStockMutation.isPending}
                              >
                                Update
                              </Button>
                            </form>
                          </div>
                        </div>
                      ))}
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
                    <Input
                      id="edit-name"
                      value={editingProduct.name}
                      onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-price">Price (₹)</Label>
                    <Input
                      id="edit-price"
                      type="number"
                      value={Math.round(editingProduct.price / 100)}
                      onChange={(e) => setEditingProduct({ ...editingProduct, price: parseInt(e.target.value) * 100 })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-description">Description</Label>
                    <Textarea
                      id="edit-description"
                      value={editingProduct.description}
                      onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-imageUrl">Image URL</Label>
                    <Input
                      id="edit-imageUrl"
                      value={editingProduct.imageUrl}
                      onChange={(e) => setEditingProduct({ ...editingProduct, imageUrl: e.target.value })}
                    />
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