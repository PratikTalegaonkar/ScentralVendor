import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import Numpad from '@/components/ui/numpad';
import VirtualKeyboard from '@/components/ui/virtual-keyboard';
import SimpleKeyboard from '@/components/ui/simple-keyboard';

import { 
  Package, 
  TrendingUp, 
  Calendar, 
  BarChart3, 
  RefreshCw, 
  LogOut, 
 
  Trash2,
  ShoppingCart,
  Droplets,
  Activity,
  Eye,
  Edit,
  X
} from 'lucide-react';

// Types
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
  spraySlot?: number | null;
  bottleSlot?: number | null;
  bottleSize?: string | null;
}

interface Order {
  id: number;
  productId: number;
  paymentMethod: string;
  amount: number;
  status: string;
  bottleSize?: string | null;
  orderType: string;
  quantity: number;
  slotNumber?: number | null;
  createdAt: string;
}

interface ComprehensiveAdminDashboardProps {
  onLogout: () => void;
}

export default function ComprehensiveAdminDashboard({ onLogout }: ComprehensiveAdminDashboardProps) {
  const [activeTab, setActiveTab] = useState('products');
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

  // Input states for keyboards
  const [activeInput, setActiveInput] = useState<string | null>(null);
  const [showNumpad, setShowNumpad] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [numpadValue, setNumpadValue] = useState('');
  const [keyboardValue, setKeyboardValue] = useState('');

  // Product preview modal state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  
  // Product edit state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    price: '',
    price30ml: '',
    price60ml: '',
    price100ml: '',
    bottleStock30ml: 0,
    bottleStock60ml: 0,
    bottleStock100ml: 0,
    imageUrl: '',
    available: true
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Helper functions for input handling
  const handleTextInput = (field: string, placeholder: string = '') => {
    setActiveInput(field);
    setKeyboardValue(newProduct[field as keyof typeof newProduct] as string || '');
    setShowKeyboard(true);
  };

  const handleNumberInput = (field: string, isPrice = false) => {
    setActiveInput(field);
    setNumpadValue(newProduct[field as keyof typeof newProduct] as string || '');
    setShowNumpad(true);
  };

  const handleKeyboardDone = () => {
    if (activeInput) {
      if (showEditModal) {
        setEditForm(prev => ({
          ...prev,
          [activeInput]: keyboardValue
        }));
      } else {
        setNewProduct(prev => ({
          ...prev,
          [activeInput]: keyboardValue
        }));
      }
    }
    setShowKeyboard(false);
    setActiveInput(null);
    setKeyboardValue('');
  };

  const handleNumpadDone = () => {
    if (activeInput) {
      if (showEditModal) {
        setEditForm(prev => ({
          ...prev,
          [activeInput]: numpadValue
        }));
      } else {
        setNewProduct(prev => ({
          ...prev,
          [activeInput]: numpadValue
        }));
      }
    }
    setShowNumpad(false);
    setActiveInput(null);
    setNumpadValue('');
  };

  // Queries
  const { data: products, isLoading: productsLoading, refetch: refetchProducts } = useQuery<Product[]>({
    queryKey: ['/api/admin/products'],
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    refetchInterval: 5000,
  });

  const { data: orders, isLoading: ordersLoading, refetch: refetchOrders } = useQuery<Order[]>({
    queryKey: ['/api/admin/orders'],
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    refetchInterval: 5000,
  });

  // Mutations
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

  const updateStockMutation = useMutation({
    mutationFn: async ({ productId, stockType, quantity }: { productId: number; stockType: string; quantity: number }) => {
      const endpoint = stockType === 'spray' 
        ? `/api/admin/products/${productId}/spray-stock`
        : `/api/admin/products/${productId}/bottle-stock`;
      
      const response = await apiRequest('PUT', endpoint, { quantity, bottleSize: stockType !== 'spray' ? stockType : undefined });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Stock updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update stock",
        variant: "destructive",
      });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async (productData: any) => {
      const response = await apiRequest('PUT', `/api/admin/products/${productData.id}`, productData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Product updated successfully",
      });
      setShowEditModal(false);
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

  // Bottle slot removal mutation
  const removeBottleSlotMutation = useMutation({
    mutationFn: async ({ slotNumber, productId, bottleSize }: { slotNumber: number, productId: number, bottleSize: string }) => {
      const token = localStorage.getItem('adminToken');
      return fetch(`/api/admin/slots/bottle/${slotNumber}/product/${productId}`, {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ bottleSize })
      }).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/slots/bottle'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      toast({ title: 'Success', description: 'Product removed from bottle slot' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to remove product', variant: 'destructive' });
    }
  });

  // Utility functions
  const formatPrice = (priceInCents: number) => {
    return `₹${(priceInCents / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Spray Slot Management Component
  const SpraySlotManagement = () => {
    const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
    const [assignmentProduct, setAssignmentProduct] = useState<number | null>(null);
    
    const { data: products } = useQuery<Product[]>({ queryKey: ['/api/admin/products'] });
    
    const assignProductMutation = useMutation({
      mutationFn: async ({ productId, slotNumber }: { productId: number, slotNumber: number }) => {
        const token = localStorage.getItem('adminToken');
        return await fetch(`/api/admin/slots/spray/${slotNumber}/assign`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ productId })
        }).then(res => res.json());
      },
      onSuccess: () => {
        // Invalidate product queries to refresh slot assignments
        queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
        setSelectedSlot(null);
        setAssignmentProduct(null);
        toast({ title: 'Success', description: 'Product assigned to spray slot successfully' });
      }
    });

    return (
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-luxe-gold">Spray Slot Management (Slots 1-5)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4 mb-6">
            {[1, 2, 3, 4, 5].map(slotNumber => {
              // Use products data to find assigned spray slot
              const assignedProduct = products?.find((p: Product) => p.spraySlot === slotNumber);
              
              return (
                <div key={slotNumber} className="text-center">
                  <div className={`p-4 rounded-lg border-2 ${
                    assignedProduct ? 'border-green-500 bg-green-500/20' : 'border-gray-600'
                  }`}>
                    <div className="text-luxe-gold font-bold mb-2">Slot {slotNumber}</div>
                    {assignedProduct ? (
                      <div>
                        <div className="text-white text-sm">{assignedProduct.name}</div>
                        <div className="text-platinum text-xs">Stock: {assignedProduct.sprayStock}</div>
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          className="mt-2"
                          onClick={async () => {
                            try {
                              const token = localStorage.getItem('adminToken');
                              await fetch(`/api/admin/slots/spray/${slotNumber}/product/${assignedProduct.id}`, {
                                method: 'DELETE',
                                headers: { 
                                  'Content-Type': 'application/json',
                                  'Authorization': `Bearer ${token}`
                                }
                              });
                              queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
                              toast({ title: 'Success', description: 'Product removed from spray slot' });
                            } catch (error) {
                              toast({ title: 'Error', description: 'Failed to remove product', variant: 'destructive' });
                            }
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <div className="text-gray-400 text-sm">Empty</div>
                        <Button 
                          size="sm" 
                          className="mt-2 bg-luxe-gold text-black hover:bg-luxe-gold/80"
                          onClick={() => setSelectedSlot(slotNumber)}
                        >
                          Assign
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Assignment Modal */}
          {selectedSlot && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <Card className="bg-gray-800 border-gray-700 max-w-md w-full m-4">
                <CardHeader>
                  <CardTitle className="text-luxe-gold">Assign Product to Slot {selectedSlot}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select onValueChange={(value) => setAssignmentProduct(parseInt(value))}>
                    <SelectTrigger className="bg-gray-700 border-gray-600">
                      <SelectValue placeholder="Select a product..." />
                    </SelectTrigger>
                    <SelectContent>
                      {products?.filter((p: Product) => p.sprayStock > 0).map((product: Product) => (
                        <SelectItem key={product.id} value={product.id.toString()}>
                          {product.name} (Stock: {product.sprayStock})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex gap-2 mt-4">
                    <Button 
                      onClick={() => {
                        if (assignmentProduct) {
                          assignProductMutation.mutate({ productId: assignmentProduct, slotNumber: selectedSlot });
                        }
                      }}
                      disabled={!assignmentProduct}
                      className="bg-luxe-gold text-black hover:bg-luxe-gold/80"
                    >
                      Assign
                    </Button>
                    <Button variant="secondary" onClick={() => {
                      setSelectedSlot(null);
                      setAssignmentProduct(null);
                    }}>
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Bottle Slot Management Component
  const BottleSlotManagement = () => {
    const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
    const [assignmentProduct, setAssignmentProduct] = useState<number | null>(null);
    const [bottleSize, setBottleSize] = useState<'30ml' | '60ml' | '100ml'>('30ml');
    const [slotQuantity, setSlotQuantity] = useState<string>('1');
    const [availableQuantity, setAvailableQuantity] = useState<number>(0);
    
    const { data: products } = useQuery<Product[]>({ queryKey: ['/api/admin/products'] });

    // Fetch available quantity when product or bottle size changes
    const fetchAvailableQuantity = async (productId: number, size: '30ml' | '60ml' | '100ml') => {
      if (!productId) return;
      try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`/api/admin/products/${productId}/available-quantity/${size}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setAvailableQuantity(data.availableQuantity);
        }
      } catch (error) {
        console.error('Failed to fetch available quantity:', error);
        setAvailableQuantity(0);
      }
    };

    // Update available quantity when product or bottle size changes
    useEffect(() => {
      if (assignmentProduct && bottleSize) {
        fetchAvailableQuantity(assignmentProduct, bottleSize);
      }
    }, [assignmentProduct, bottleSize]);

    const assignBottleSlotMutation = useMutation({
      mutationFn: async ({ productId, slotNumber, bottleSize, slotQuantity }: { productId: number, slotNumber: number, bottleSize: string, slotQuantity: number }) => {
        const token = localStorage.getItem('adminToken');
        return await fetch(`/api/admin/slots/bottle/${slotNumber}/assign`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ productId, bottleSize, slotQuantity })
        }).then(res => res.json());
      },
      onSuccess: () => {
        // Invalidate bottle slot queries to refresh slot assignments
        queryClient.invalidateQueries({ queryKey: ['/api/admin/slots/bottle'] });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
        setSelectedSlot(null);
        setAssignmentProduct(null);
        setSlotQuantity('1');
        setAvailableQuantity(0);
        toast({ title: 'Success', description: 'Product assigned to bottle slot successfully' });
      },
      onError: (error: any) => {
        toast({ 
          title: 'Error', 
          description: error.message || 'Failed to assign product to bottle slot',
          variant: 'destructive'
        });
      }
    });

    return (
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-luxe-gold">Bottle Slot Management (Slots 1-15)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-3 mb-6">
            {Array.from({ length: 15 }, (_, i) => i + 1).map(slotNumber => {
              // Query bottle slot assignments with proper auth headers
              const { data: slotAssignments, isError, isLoading, refetch } = useQuery({
                queryKey: [`/api/admin/slots/bottle/${slotNumber}/products`],
                queryFn: async () => {
                  const token = localStorage.getItem('adminToken');
                  const response = await fetch(`/api/admin/slots/bottle/${slotNumber}/products`, {
                    headers: {
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'application/json'
                    }
                  });
                  if (!response.ok) {
                    // If auth fails, return empty array instead of throwing
                    console.warn(`Failed to fetch slot ${slotNumber} assignments:`, response.status);
                    return [];
                  }
                  return response.json();
                },
                enabled: true,
                retry: 1,
                staleTime: 0, // Always refetch
                cacheTime: 0  // Don't cache
              });
              
              // Show all assignments for this slot, not just the first one
              const assignments = Array.isArray(slotAssignments) ? slotAssignments : [];
              const hasAssignments = assignments.length > 0;
              
              return (
                <div key={slotNumber} className="text-center">
                  <div className={`p-2 rounded-lg border-2 ${
                    hasAssignments ? 'border-purple-500 bg-purple-500/20' : 'border-gray-600'
                  }`}>
                    <div className="text-luxe-gold font-bold mb-1 text-xs">Slot {slotNumber}</div>
                    {isLoading ? (
                      <div className="text-gray-400 text-xs">Loading...</div>
                    ) : hasAssignments ? (
                      <div className="space-y-1">
                        {assignments.map((assignment: any, idx: number) => (
                          <div key={idx} className="border-b border-gray-600 pb-1 last:border-b-0">
                            <div className="text-white text-xs font-semibold">{assignment.product?.name}</div>
                            <div className="text-platinum text-xs">{assignment.bottleSize}</div>
                            <div className="text-platinum text-xs">Product Stock: {
                              assignment.bottleSize === '30ml' ? assignment.product?.bottleStock30ml :
                              assignment.bottleSize === '60ml' ? assignment.product?.bottleStock60ml :
                              assignment.product?.bottleStock100ml
                            }</div>
                            <div className="text-luxe-gold text-xs">Slot Qty: {assignment.slotQuantity || 1}</div>
                            <Button 
                              size="sm" 
                              variant="destructive" 
                              className="mt-1 text-xs px-1 py-0.5"
                              onClick={() => {
                                removeBottleSlotMutation.mutate({
                                  slotNumber,
                                  productId: assignment.product.id,
                                  bottleSize: assignment.bottleSize
                                });
                              }}
                              disabled={removeBottleSlotMutation.isPending}
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div>
                        <div className="text-gray-400 text-xs">Empty</div>
                        <Button 
                          size="sm" 
                          className="mt-1 bg-luxe-gold text-black hover:bg-luxe-gold/80 text-xs px-2 py-1"
                          onClick={() => setSelectedSlot(slotNumber)}
                        >
                          Assign
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Assignment Modal */}
          {selectedSlot && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <Card className="bg-gray-800 border-gray-700 max-w-md w-full m-4">
                <CardHeader>
                  <CardTitle className="text-luxe-gold">Assign Product to Bottle Slot {selectedSlot}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-platinum">Product</Label>
                    <Select onValueChange={(value) => setAssignmentProduct(parseInt(value))}>
                      <SelectTrigger className="bg-gray-700 border-gray-600">
                        <SelectValue placeholder="Select a product..." />
                      </SelectTrigger>
                      <SelectContent>
                        {products && products.map((product: Product) => (
                          <SelectItem key={product.id} value={product.id.toString()}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-platinum">Bottle Size</Label>
                    <Select value={bottleSize} onValueChange={(value: '30ml' | '60ml' | '100ml') => setBottleSize(value)}>
                      <SelectTrigger className="bg-gray-700 border-gray-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30ml">30ml</SelectItem>
                        <SelectItem value="60ml">60ml</SelectItem>
                        <SelectItem value="100ml">100ml</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-platinum">Slot Quantity</Label>
                    <div className="text-xs text-platinum mb-1">Available: {availableQuantity}</div>
                    <Input
                      type="number"
                      min="1"
                      max={Math.min(20, availableQuantity)}
                      value={slotQuantity}
                      onChange={(e) => setSlotQuantity(e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="Enter quantity..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => {
                        if (assignmentProduct && slotQuantity && parseInt(slotQuantity) > 0) {
                          assignBottleSlotMutation.mutate({ 
                            productId: assignmentProduct, 
                            slotNumber: selectedSlot,
                            bottleSize,
                            slotQuantity: parseInt(slotQuantity)
                          });
                        }
                      }}
                      disabled={!assignmentProduct || !slotQuantity || parseInt(slotQuantity) < 1 || parseInt(slotQuantity) > availableQuantity}
                      className="bg-luxe-gold text-black hover:bg-luxe-gold/80"
                    >
                      Assign
                    </Button>
                    <Button variant="secondary" onClick={() => {
                      setSelectedSlot(null);
                      setAssignmentProduct(null);
                      setSlotQuantity('1');
                      setAvailableQuantity(0);
                    }}>
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Daily Report Section Component
  const DailyReportSection = () => {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    
    const { data: dailyReport } = useQuery({
      queryKey: ['/api/admin/sales/daily', selectedDate],
      queryFn: async () => {
        const response = await fetch(`/api/admin/sales/daily?date=${selectedDate}`);
        return response.json();
      }
    });

    return (
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-luxe-gold">Daily Sales Report</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <Label className="text-platinum">Select Date</Label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-gray-700 border-gray-600 text-white max-w-xs"
            />
          </div>

          {dailyReport ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-gray-700/50 border-gray-600">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-luxe-gold">₹{(dailyReport as any)?.totalRevenue || 0}</div>
                  <div className="text-sm text-platinum">Total Revenue</div>
                </CardContent>
              </Card>
              <Card className="bg-gray-700/50 border-gray-600">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-white">{(dailyReport as any)?.totalOrders || 0}</div>
                  <div className="text-sm text-platinum">Total Orders</div>
                </CardContent>
              </Card>
              <Card className="bg-gray-700/50 border-gray-600">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-400">{(dailyReport as any)?.sprayOrders || 0}</div>
                  <div className="text-sm text-platinum">Spray Orders</div>
                </CardContent>
              </Card>
              <Card className="bg-gray-700/50 border-gray-600">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-400">{(dailyReport as any)?.bottleOrders || 0}</div>
                  <div className="text-sm text-platinum">Bottle Orders</div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-8 text-platinum">
              No sales data available for {selectedDate}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Analytics Section Component
  const AnalyticsSection = () => {
    const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
    
    const { data: analytics } = useQuery({
      queryKey: ['/api/admin/analytics', period],
      queryFn: async () => {
        const response = await fetch(`/api/admin/analytics?period=${period}`);
        return response.json();
      }
    });

    return (
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-luxe-gold">Sales Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <Label className="text-platinum">Analysis Period</Label>
            <Select value={period} onValueChange={(value: 'daily' | 'weekly' | 'monthly') => setPeriod(value)}>
              <SelectTrigger className="bg-gray-700 border-gray-600 max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {analytics ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Card className="bg-gray-700/50 border-gray-600">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-luxe-gold">₹{(analytics as any)?.totalRevenue || 0}</div>
                    <div className="text-sm text-platinum">Total Revenue</div>
                  </CardContent>
                </Card>
                <Card className="bg-gray-700/50 border-gray-600">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-white">{(analytics as any)?.totalOrders || 0}</div>
                    <div className="text-sm text-platinum">Total Orders</div>
                  </CardContent>
                </Card>
                <Card className="bg-gray-700/50 border-gray-600">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-400">₹{(analytics as any)?.averageOrderValue || 0}</div>
                    <div className="text-sm text-platinum">Avg Order Value</div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-gray-700/50 border-gray-600">
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-luxe-gold mb-2">Order Breakdown</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-platinum">Spray Orders:</span>
                        <span className="text-blue-400">{(analytics as any)?.sprayOrders || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-platinum">Bottle Orders:</span>
                        <span className="text-purple-400">{(analytics as any)?.bottleOrders || 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gray-700/50 border-gray-600">
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-luxe-gold mb-2">Performance Metrics</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-platinum">Conversion Rate:</span>
                        <span className="text-green-400">--</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-platinum">Growth:</span>
                        <span className="text-green-400">--</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-platinum">
              Loading analytics data...
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newProduct.name || !newProduct.description || !newProduct.price || !newProduct.imageUrl) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const productData = {
      name: newProduct.name,
      description: newProduct.description,
      price: Math.round(parseFloat(newProduct.price) * 100),
      price30ml: Math.round(parseFloat(newProduct.price30ml) * 100),
      price60ml: Math.round(parseFloat(newProduct.price60ml) * 100),
      price100ml: Math.round(parseFloat(newProduct.price100ml) * 100),
      imageUrl: newProduct.imageUrl,
      available: newProduct.available,
      sprayStock: 100,
      bottleStock30ml: 20,
      bottleStock60ml: 20,
      bottleStock100ml: 20,
    };

    createProductMutation.mutate(productData);
  };

  const handleStockChange = (productId: number, stockType: string, change: number) => {
    const product = products?.find(p => p.id === productId);
    if (!product) return;

    let currentStock = 0;
    let maxStock = undefined;
    
    switch (stockType) {
      case 'spray':
        currentStock = product.sprayStock;
        // No limit for sprays - flexible input
        break;
      case '30ml':
        currentStock = product.bottleStock30ml;
        maxStock = 20; // Bottle limit
        break;
      case '60ml':
        currentStock = product.bottleStock60ml;
        maxStock = 20; // Bottle limit
        break;
      case '100ml':
        currentStock = product.bottleStock100ml;
        maxStock = 20; // Bottle limit
        break;
    }

    let newStock = Math.max(0, currentStock + change);
    
    // Apply bottle stock limits
    if (maxStock !== undefined && newStock > maxStock) {
      newStock = maxStock;
      toast({
        title: "Stock Limit Reached",
        description: `Maximum ${maxStock} bottles allowed for ${stockType} bottles`,
        variant: "destructive",
      });
      return;
    }
    
    updateStockMutation.mutate({ productId, stockType, quantity: newStock });
  };

  const handleProductPreview = (product: Product) => {
    setSelectedProduct(product);
    setShowPreviewModal(true);
  };

  const handleProductEdit = (product: Product) => {
    setEditingProduct(product);
    setEditForm({
      name: product.name,
      description: product.description,
      price: (product.price / 100).toString(),
      price30ml: (product.price30ml / 100).toString(),
      price60ml: (product.price60ml / 100).toString(),
      price100ml: (product.price100ml / 100).toString(),
      bottleStock30ml: product.bottleStock30ml,
      bottleStock60ml: product.bottleStock60ml,
      bottleStock100ml: product.bottleStock100ml,
      imageUrl: product.imageUrl,
      available: product.available
    });
    setShowEditModal(true);
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingProduct || !editForm.name || !editForm.description || !editForm.price || !editForm.imageUrl) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const productData = {
      id: editingProduct.id,
      name: editForm.name,
      description: editForm.description,
      price: Math.round(parseFloat(editForm.price) * 100),
      price30ml: Math.round(parseFloat(editForm.price30ml) * 100),
      price60ml: Math.round(parseFloat(editForm.price60ml) * 100),
      price100ml: Math.round(parseFloat(editForm.price100ml) * 100),
      bottleStock30ml: editForm.bottleStock30ml,
      bottleStock60ml: editForm.bottleStock60ml,
      bottleStock100ml: editForm.bottleStock100ml,
      imageUrl: editForm.imageUrl,
      available: editForm.available
    };

    updateProductMutation.mutate(productData);
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
                <span className="text-luxe-gold">SCENTRA</span> Stock Management
              </h1>
              <p className="text-platinum">Comprehensive inventory & sales management system</p>
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
                onClick={onLogout}
                variant="outline"
                className="bg-red-600 hover:bg-red-700 text-white border-red-600"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-6 mb-8 bg-gray-800/50 border border-gray-700">
              <TabsTrigger value="products" className="data-[state=active]:bg-luxe-gold data-[state=active]:text-black">
                <Package className="mr-2 h-4 w-4" />
                Products
              </TabsTrigger>
              <TabsTrigger value="spray-slots" className="data-[state=active]:bg-luxe-gold data-[state=active]:text-black">
                <Droplets className="mr-2 h-4 w-4" />
                Spray Slots
              </TabsTrigger>
              <TabsTrigger value="bottle-slots" className="data-[state=active]:bg-luxe-gold data-[state=active]:text-black">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Bottle Slots
              </TabsTrigger>
              <TabsTrigger value="orders" className="data-[state=active]:bg-luxe-gold data-[state=active]:text-black">
                <Activity className="mr-2 h-4 w-4" />
                Order History
              </TabsTrigger>
              <TabsTrigger value="daily-report" className="data-[state=active]:bg-luxe-gold data-[state=active]:text-black">
                <Calendar className="mr-2 h-4 w-4" />
                Daily Report
              </TabsTrigger>
              <TabsTrigger value="analytics" className="data-[state=active]:bg-luxe-gold data-[state=active]:text-black">
                <BarChart3 className="mr-2 h-4 w-4" />
                Analytics
              </TabsTrigger>
            </TabsList>

            {/* Products Management Section */}
            <TabsContent value="products" className="space-y-6">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-luxe-gold">Add New Product</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateProduct} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="name" className="text-platinum">Product Name</Label>
                      <Button
                        type="button"
                        onClick={() => handleTextInput('name', 'e.g., Noir Elegance')}
                        className="w-full h-12 bg-gray-700 border-gray-600 text-white text-left justify-start hover:bg-gray-600"
                        variant="outline"
                      >
                        {newProduct.name || 'e.g., Noir Elegance'}
                      </Button>
                    </div>
                    <div>
                      <Label htmlFor="description" className="text-platinum">Description</Label>
                      <Button
                        type="button"
                        onClick={() => handleTextInput('description', 'e.g., Mysterious & Sophisticated')}
                        className="w-full h-12 bg-gray-700 border-gray-600 text-white text-left justify-start hover:bg-gray-600"
                        variant="outline"
                      >
                        {newProduct.description || 'e.g., Mysterious & Sophisticated'}
                      </Button>
                    </div>
                    <div>
                      <Label htmlFor="spray-price" className="text-platinum">Spray Price (₹)</Label>
                      <Button
                        type="button"
                        onClick={() => handleNumberInput('price', true)}
                        className="w-full h-12 bg-gray-700 border-gray-600 text-white text-left justify-start hover:bg-gray-600"
                        variant="outline"
                      >
                        {newProduct.price || '125.00'}
                      </Button>
                    </div>
                    <div>
                      <Label htmlFor="image-url" className="text-platinum">Image URL</Label>
                      <Button
                        type="button"
                        onClick={() => handleTextInput('imageUrl', 'https://...')}
                        className="w-full h-12 bg-gray-700 border-gray-600 text-white text-left justify-start hover:bg-gray-600"
                        variant="outline"
                      >
                        {newProduct.imageUrl || 'https://...'}
                      </Button>
                    </div>
                    <div>
                      <Label htmlFor="price-30ml" className="text-platinum">30ml Price (₹)</Label>
                      <Button
                        type="button"
                        onClick={() => handleNumberInput('price30ml', true)}
                        className="w-full h-12 bg-gray-700 border-gray-600 text-white text-left justify-start hover:bg-gray-600"
                        variant="outline"
                      >
                        {newProduct.price30ml || '25.00'}
                      </Button>
                    </div>
                    <div>
                      <Label htmlFor="price-60ml" className="text-platinum">60ml Price (₹)</Label>
                      <Button
                        type="button"
                        onClick={() => handleNumberInput('price60ml', true)}
                        className="w-full h-12 bg-gray-700 border-gray-600 text-white text-left justify-start hover:bg-gray-600"
                        variant="outline"
                      >
                        {newProduct.price60ml || '45.00'}
                      </Button>
                    </div>
                    <div>
                      <Label htmlFor="price-100ml" className="text-platinum">100ml Price (₹)</Label>
                      <Button
                        type="button"
                        onClick={() => handleNumberInput('price100ml', true)}
                        className="w-full h-12 bg-gray-700 border-gray-600 text-white text-left justify-start hover:bg-gray-600"
                        variant="outline"
                      >
                        {newProduct.price100ml || '65.00'}
                      </Button>
                    </div>
                    <div className="flex items-end">
                      <Button 
                        type="submit" 
                        className="w-full bg-luxe-gold hover:bg-luxe-gold/80 text-black font-medium"
                        disabled={createProductMutation.isPending}
                      >
                        {createProductMutation.isPending ? 'Adding...' : 'Add Product'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Product Inventory with Edit Options */}
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-luxe-gold flex items-center">
                    <Package className="h-6 w-6 mr-2" />
                    Product Inventory Management
                  </CardTitle>
                  <p className="text-platinum">Product image, name, stock with edit options for spray/bottle counts and pricing</p>
                </CardHeader>
                <CardContent>
                  {productsLoading ? (
                    <div className="text-center py-8 text-platinum">Loading products...</div>
                  ) : (
                    <div className="space-y-6">
                      {products?.map((product) => (
                        <motion.div
                          key={product.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          className="bg-gray-900 rounded-xl border border-gray-700 hover:border-luxe-gold/50 transition-all duration-300 overflow-hidden"
                        >
                          <div className="p-6">
                            {/* Product Header with Image, Name and Edit Button */}
                            <div className="flex items-start gap-6 mb-6">
                              {/* Product Image */}
                              <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-700 border border-gray-600 flex-shrink-0">
                                <img
                                  src={product.imageUrl || 'https://via.placeholder.com/96x96/374151/9CA3AF?text=No+Image'}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = 'https://via.placeholder.com/96x96/374151/9CA3AF?text=No+Image';
                                  }}
                                  onLoad={(e) => {
                                    // If the image loads successfully but is actually a webpage (not an image), show placeholder
                                    const target = e.target as HTMLImageElement;
                                    if (target.complete && target.naturalWidth === 0) {
                                      target.src = 'https://via.placeholder.com/96x96/374151/9CA3AF?text=Invalid+URL';
                                    }
                                  }}
                                />
                              </div>

                              {/* Product Name and Status */}
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                  <h3 className="text-xl font-bold text-white">{product.name}</h3>
                                  <Badge 
                                    variant={product.available ? "default" : "destructive"}
                                    className={product.available ? 'bg-green-600' : 'bg-red-600'}
                                  >
                                    {product.available ? 'Available' : 'Unavailable'}
                                  </Badge>
                                </div>
                                <p className="text-platinum mb-4">{product.description}</p>
                                
                                {/* Edit Product Button */}
                                <Button
                                  onClick={() => handleProductEdit(product)}
                                  className="bg-luxe-gold hover:bg-luxe-gold/80 text-black font-semibold"
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit Product Details & Pricing
                                </Button>
                              </div>
                            </div>

                            {/* Stock Management Section */}
                            <div className="border-t border-gray-700 pt-6">
                              <h4 className="text-lg font-semibold text-luxe-gold mb-4 flex items-center">
                                <Droplets className="h-5 w-5 mr-2" />
                                Stock Management
                              </h4>
                              
                              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                                {/* Spray Stock */}
                                <Card className="bg-gray-800 border-gray-600">
                                  <CardContent className="p-4 text-center">
                                    <div className="text-sm text-platinum mb-2">Spray Samples</div>
                                    <div className="text-2xl font-bold text-green-400 mb-2">
                                      {product.sprayStock}
                                    </div>
                                    <div className="text-xs text-luxe-gold mb-3">
                                      Price: {formatPrice(product.price)}
                                    </div>
                                    <Badge variant="outline" className="text-xs border-green-400 text-green-400 mb-3">
                                      Unlimited Stock
                                    </Badge>
                                    <div className="text-xs text-green-400 text-center">
                                      Updates with sales automatically
                                    </div>
                                  </CardContent>
                                </Card>

                                {/* Bottle Stocks */}
                                {[
                                  { size: '30ml', stock: product.bottleStock30ml, price: product.price30ml },
                                  { size: '60ml', stock: product.bottleStock60ml, price: product.price60ml },
                                  { size: '100ml', stock: product.bottleStock100ml, price: product.price100ml }
                                ].map(({ size, stock, price }) => {
                                  const getStockStatus = (stock: number) => {
                                    if (stock === 0) return { color: 'red', text: 'Out of Stock', bgClass: 'bg-red-500/20' };
                                    if (stock <= 5) return { color: 'yellow', text: 'Low Stock', bgClass: 'bg-yellow-500/20' };
                                    if (stock >= 20) return { color: 'red', text: 'Maximum (20)', bgClass: 'bg-red-500/20' };
                                    return { color: 'green', text: 'In Stock', bgClass: 'bg-green-500/20' };
                                  };
                                  
                                  const status = getStockStatus(stock);
                                  const isAtMax = stock >= 20;
                                  const isAtMin = stock <= 0;
                                  
                                  return (
                                    <Card key={size} className={`bg-gray-800 border-gray-600 ${status.bgClass}`}>
                                      <CardContent className="p-4 text-center">
                                        <div className="text-sm text-platinum mb-2">{size} Bottles</div>
                                        <div className={`text-2xl font-bold mb-2 ${
                                          status.color === 'green' ? 'text-green-400' :
                                          status.color === 'yellow' ? 'text-yellow-400' :
                                          'text-red-400'
                                        }`}>
                                          {stock}<span className="text-sm text-gray-400">/20</span>
                                        </div>
                                        <div className="text-xs text-luxe-gold mb-3">
                                          Price: {formatPrice(price)}
                                        </div>
                                        <Badge 
                                          variant="outline" 
                                          className={`text-xs mb-3 ${
                                            status.color === 'green' ? 'border-green-400 text-green-400' :
                                            status.color === 'yellow' ? 'border-yellow-400 text-yellow-400' :
                                            'border-red-400 text-red-400'
                                          }`}
                                        >
                                          {status.text}
                                        </Badge>
                                        <div className="text-xs text-gray-400 text-center">
                                          Updates with sales automatically
                                        </div>
                                      </CardContent>
                                    </Card>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Other tabs will be implemented next */}
            <TabsContent value="spray-slots">
              <SpraySlotManagement />
            </TabsContent>

            <TabsContent value="bottle-slots">
              <BottleSlotManagement />
            </TabsContent>

            <TabsContent value="orders">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-luxe-gold">Order History & Transaction Log</CardTitle>
                </CardHeader>
                <CardContent>
                  {ordersLoading ? (
                    <div className="text-center py-8 text-platinum">Loading orders...</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-gray-700">
                            <th className="py-3 text-luxe-gold">Order ID</th>
                            <th className="py-3 text-luxe-gold">Type</th>
                            <th className="py-3 text-luxe-gold">Product ID</th>
                            <th className="py-3 text-luxe-gold">Size</th>
                            <th className="py-3 text-luxe-gold">Quantity</th>
                            <th className="py-3 text-luxe-gold">Amount</th>
                            <th className="py-3 text-luxe-gold">Status</th>
                            <th className="py-3 text-luxe-gold">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orders?.map((order) => (
                            <tr key={order.id} className="border-b border-gray-700/50">
                              <td className="py-2 text-white font-mono">#{order.id}</td>
                              <td className="py-2">
                                <span className={`px-2 py-1 rounded text-xs ${
                                  order.orderType === 'spray' ? 'bg-blue-600' : 'bg-purple-600'
                                }`}>
                                  {order.orderType}
                                </span>
                              </td>
                              <td className="py-2 text-white">{order.productId}</td>
                              <td className="py-2 text-platinum">{order.bottleSize || 'N/A'}</td>
                              <td className="py-2 text-white">{order.quantity}</td>
                              <td className="py-2 text-luxe-gold">{formatPrice(order.amount)}</td>
                              <td className="py-2">
                                <span className={`px-2 py-1 rounded text-xs ${
                                  order.status === 'completed' ? 'bg-green-600' :
                                  order.status === 'pending' ? 'bg-yellow-600' : 'bg-red-600'
                                }`}>
                                  {order.status}
                                </span>
                              </td>
                              <td className="py-2 text-sm text-platinum">{formatDate(order.createdAt)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="daily-report">
              <DailyReportSection />
            </TabsContent>

            <TabsContent value="analytics">
              <AnalyticsSection />
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      {/* Virtual Keyboard Modal */}
      {showKeyboard && (
        <SimpleKeyboard
          onConfirm={handleKeyboardDone}
          onClose={() => {
            setShowKeyboard(false);
            setActiveInput(null);
            setKeyboardValue('');
          }}
          initialValue={keyboardValue}
          placeholder={`Enter ${activeInput}`}
          title={`Enter ${activeInput}`}
          maxLength={100}
        />
      )}

      {/* Numpad Modal */}
      {showNumpad && (
        <Numpad
          onNumberClick={(num) => {
            setNumpadValue(prev => prev + num);
          }}
          onBackspace={() => {
            setNumpadValue(prev => prev.slice(0, -1));
          }}
          onClear={() => {
            setNumpadValue('');
          }}
          onClose={handleNumpadDone}
          showDecimal={true}
          currentValue={numpadValue}
          title="Enter Price"
        />
      )}

      {/* Edit Product Modal */}
      {showEditModal && editingProduct && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-gray-800 rounded-xl border border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-luxe-gold">Edit Product Details & Pricing</h2>
                <Button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingProduct(null);
                  }}
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <form onSubmit={handleUpdateProduct} className="space-y-6">
                {/* Product Name */}
                <div>
                  <Label className="text-platinum mb-2 block">Product Name *</Label>
                  <Input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    onFocus={() => {
                      setActiveInput('name');
                      setKeyboardValue(editForm.name);
                      setShowKeyboard(true);
                    }}
                    placeholder="Enter product name..."
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 h-12"
                  />
                </div>

                {/* Product Description */}
                <div>
                  <Label className="text-platinum mb-2 block">Description *</Label>
                  <Input
                    type="text"
                    value={editForm.description}
                    onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                    onFocus={() => {
                      setActiveInput('description');
                      setKeyboardValue(editForm.description);
                      setShowKeyboard(true);
                    }}
                    placeholder="Enter description..."
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 h-12"
                  />
                </div>

                {/* Image URL */}
                <div>
                  <Label className="text-platinum mb-2 block">Image URL *</Label>
                  <div className="relative">
                    <Input
                      type="url"
                      value={editForm.imageUrl}
                      onChange={(e) => setEditForm(prev => ({ ...prev, imageUrl: e.target.value }))}
                      onFocus={() => {
                        setActiveInput('imageUrl');
                        setKeyboardValue(editForm.imageUrl);
                        setShowKeyboard(true);
                      }}
                      placeholder="Enter image URL or paste from clipboard..."
                      className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 h-12 pr-24"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 px-3 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border-blue-600/50"
                      onClick={async () => {
                        try {
                          const text = await navigator.clipboard.readText();
                          if (text && (text.startsWith('http://') || text.startsWith('https://'))) {
                            setEditForm(prev => ({ ...prev, imageUrl: text }));
                            toast({
                              title: "Success",
                              description: "Image URL pasted from clipboard",
                            });
                          } else {
                            toast({
                              title: "Invalid URL",
                              description: "Clipboard doesn't contain a valid URL",
                              variant: "destructive",
                            });
                          }
                        } catch (error) {
                          toast({
                            title: "Paste Failed",
                            description: "Unable to access clipboard. Please paste manually.",
                            variant: "destructive",
                          });
                        }
                      }}
                    >
                      Paste
                    </Button>
                  </div>
                </div>

                {/* Pricing Grid */}
                <div>
                  <Label className="text-platinum mb-4 block">Pricing (in Rupees)</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-platinum mb-2 block">Spray Sample Price *</Label>
                      <div className="relative">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editForm.price}
                          onChange={(e) => setEditForm(prev => ({ ...prev, price: e.target.value }))}
                          onFocus={() => {
                            setActiveInput('price');
                            setNumpadValue(editForm.price);
                            setShowNumpad(true);
                          }}
                          placeholder="0.00"
                          className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 h-12 pl-8"
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm text-platinum mb-2 block">30ml Bottle Price</Label>
                      <div className="relative">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editForm.price30ml}
                          onChange={(e) => setEditForm(prev => ({ ...prev, price30ml: e.target.value }))}
                          onFocus={() => {
                            setActiveInput('price30ml');
                            setNumpadValue(editForm.price30ml);
                            setShowNumpad(true);
                          }}
                          placeholder="0.00"
                          className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 h-12 pl-8"
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm text-platinum mb-2 block">60ml Bottle Price</Label>
                      <div className="relative">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editForm.price60ml}
                          onChange={(e) => setEditForm(prev => ({ ...prev, price60ml: e.target.value }))}
                          onFocus={() => {
                            setActiveInput('price60ml');
                            setNumpadValue(editForm.price60ml);
                            setShowNumpad(true);
                          }}
                          placeholder="0.00"
                          className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 h-12 pl-8"
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm text-platinum mb-2 block">100ml Bottle Price</Label>
                      <div className="relative">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editForm.price100ml}
                          onChange={(e) => setEditForm(prev => ({ ...prev, price100ml: e.target.value }))}
                          onFocus={() => {
                            setActiveInput('price100ml');
                            setNumpadValue(editForm.price100ml);
                            setShowNumpad(true);
                          }}
                          placeholder="0.00"
                          className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 h-12 pl-8"
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottle Stock Management */}
                <div>
                  <Label className="text-platinum mb-4 block">Bottle Stock Levels</Label>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm text-platinum mb-2 block">30ml Stock</Label>
                      <Input
                        type="number"
                        min="0"
                        max="20"
                        value={editForm.bottleStock30ml}
                        onChange={(e) => setEditForm(prev => ({ ...prev, bottleStock30ml: parseInt(e.target.value) || 0 }))}
                        onFocus={() => {
                          setActiveInput('bottleStock30ml');
                          setNumpadValue(editForm.bottleStock30ml.toString());
                          setShowNumpad(true);
                        }}
                        placeholder="0"
                        className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 h-12"
                      />
                      <div className="text-xs text-gray-400 mt-1">Max: 20 bottles</div>
                    </div>
                    <div>
                      <Label className="text-sm text-platinum mb-2 block">60ml Stock</Label>
                      <Input
                        type="number"
                        min="0"
                        max="20"
                        value={editForm.bottleStock60ml}
                        onChange={(e) => setEditForm(prev => ({ ...prev, bottleStock60ml: parseInt(e.target.value) || 0 }))}
                        onFocus={() => {
                          setActiveInput('bottleStock60ml');
                          setNumpadValue(editForm.bottleStock60ml.toString());
                          setShowNumpad(true);
                        }}
                        placeholder="0"
                        className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 h-12"
                      />
                      <div className="text-xs text-gray-400 mt-1">Max: 20 bottles</div>
                    </div>
                    <div>
                      <Label className="text-sm text-platinum mb-2 block">100ml Stock</Label>
                      <Input
                        type="number"
                        min="0"
                        max="20"
                        value={editForm.bottleStock100ml}
                        onChange={(e) => setEditForm(prev => ({ ...prev, bottleStock100ml: parseInt(e.target.value) || 0 }))}
                        onFocus={() => {
                          setActiveInput('bottleStock100ml');
                          setNumpadValue(editForm.bottleStock100ml.toString());
                          setShowNumpad(true);
                        }}
                        placeholder="0"
                        className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 h-12"
                      />
                      <div className="text-xs text-gray-400 mt-1">Max: 20 bottles</div>
                    </div>
                  </div>
                  <div className="text-xs text-green-400 mt-2">
                    Stock levels will automatically decrease when bottles are sold
                  </div>
                </div>

                {/* Availability Toggle */}
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="editAvailable"
                    checked={editForm.available}
                    onChange={(e) => setEditForm(prev => ({ ...prev, available: e.target.checked }))}
                    className="w-5 h-5 rounded border-gray-600 bg-gray-700"
                  />
                  <Label htmlFor="editAvailable" className="text-platinum">Product Available for Purchase</Label>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4">
                  <Button
                    type="submit"
                    disabled={updateProductMutation.isPending}
                    className="flex-1 bg-luxe-gold hover:bg-luxe-gold/80 text-black font-semibold h-12"
                  >
                    {updateProductMutation.isPending ? 'Updating...' : 'Update Product'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingProduct(null);
                    }}
                    className="px-8 h-12 border-gray-600 hover:bg-gray-700"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}