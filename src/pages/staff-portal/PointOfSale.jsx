// 🛒 POINT OF SALE SYSTEM - Complete POS for gym transactions
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart, CreditCard, DollarSign, Package, Users, Search,
  Plus, Minus, X, Check, Calculator, Receipt, Barcode,
  Tag, Percent, Gift, Clock, AlertCircle, CheckCircle, UserCog,
  Coffee, Shirt, Glasses, UserCheck, Zap, Apple, Ticket,
  Calendar, UserPlus, Watch, Settings
} from 'lucide-react';

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Hooks and Services
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';

// Icon mapping for categories and products
const getIconComponent = (iconName) => {
  const iconMap = {
    'Coffee': Coffee,
    'Shirt': Shirt,
    'Glasses': Glasses,
    'UserCheck': UserCheck,
    'CreditCard': CreditCard,
    'Package': Package,
    'Zap': Zap,
    'Users': Users,
    'Apple': Apple,
    'Ticket': Ticket,
    'Calendar': Calendar,
    'UserPlus': UserPlus,
    'Milk': Package, // Fallback for protein bottle
    'Watch': Watch
  };
  return iconMap[iconName] || Package;
};

const PointOfSale = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  // State management
  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [customer, setCustomer] = useState(null);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [guestInfo, setGuestInfo] = useState({ name: '', email: '', phone: '' });
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cashReceived, setCashReceived] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch categories and products
  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('pos_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (categoriesError) {
        console.error('Categories error:', categoriesError);
        throw categoriesError;
      }

      // Fetch products first
      const { data: productsData, error: productsError } = await supabase
        .from('pos_inventory')
        .select('*')
        .eq('is_active', true)
        .order('name');

      // Then fetch categories and match them
      let enrichedProducts = productsData || [];
      if (productsData && categoriesData) {
        enrichedProducts = productsData.map(product => {
          const category = categoriesData.find(cat => cat.id === product.category_id);
          return {
            ...product,
            category: category || null
          };
        });
      }

      if (productsError) {
        console.error('Products error:', productsError);
        throw productsError;
      }

      console.log('Fetched categories:', categoriesData);
      console.log('Fetched products:', productsData);
      console.log('Enriched products:', enrichedProducts);

      setCategories([{ name: 'All', slug: 'all' }, ...(categoriesData || [])]);
      setProducts(enrichedProducts);

    } catch (error) {
      console.error('Error fetching POS data:', error);
      toast({
        title: "Error loading data",
        description: "Failed to load products and categories",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Test database connection
  const testConnection = async () => {
    try {
      console.log('Testing database connection...');
      const { data, error } = await supabase.from('pos_categories').select('count');
      console.log('Test query result:', { data, error });
    } catch (err) {
      console.error('Test connection error:', err);
    }
  };

  // Load data on component mount
  useEffect(() => {
    console.log('POS - Component mounted, fetching data...');
    testConnection();
    fetchData();
  }, []);

  // Filtered products
  const filteredProducts = products.filter(product => {
    const categoryMatch = selectedCategory === 'All' ||
                         (product.category && product.category.name === selectedCategory);
    const searchMatch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       (product.barcode && product.barcode.includes(searchQuery)) ||
                       (product.sku && product.sku.includes(searchQuery));
    return categoryMatch && searchMatch;
  });

  // Debug logging
  console.log('POS - Current state:', {
    products: products.length,
    categories: categories.length,
    filteredProducts: filteredProducts.length,
    selectedCategory,
    loading
  });

  // Cart calculations
  const subtotal = cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + tax;

  // Add item to cart
  const addToCart = useCallback((product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
    
    toast({
      title: "Added to cart",
      description: `${product.name} added to cart`,
    });
  }, [toast]);

  // Remove item from cart
  const removeFromCart = useCallback((productId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  }, []);

  // Update quantity
  const updateQuantity = useCallback((productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  }, [removeFromCart]);

  // Clear cart
  const clearCart = useCallback(() => {
    setCart([]);
    setCustomer(null);
  }, []);

  // Search for customer
  const searchCustomer = async (query) => {
    if (!query.trim()) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, phone')
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`)
        .limit(10);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Customer search error:', error);
      toast({
        title: "Search failed",
        description: "Unable to search customers",
        variant: "destructive"
      });
      return [];
    }
  };

  // Process payment
  const processPayment = async () => {
    if (cart.length === 0) {
      toast({
        title: "Empty cart",
        description: "Please add items to cart before processing payment",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Save transaction to database
      const transactionData = {
        staff_id: user.id,
        customer_id: customer?.id || null,
        guest_name: !customer && guestInfo.name ? guestInfo.name : null,
        guest_email: !customer && guestInfo.email ? guestInfo.email : null,
        guest_phone: !customer && guestInfo.phone ? guestInfo.phone : null,
        items: cart,
        subtotal: subtotal,
        tax_amount: tax,
        total_amount: total,
        payment_method: paymentMethod,
        cash_received: paymentMethod === 'cash' ? parseFloat(cashReceived) : null,
        change_given: paymentMethod === 'cash' ? Math.max(0, parseFloat(cashReceived) - total) : null,
        transaction_type: 'pos',
        status: 'completed'
      };

      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert([transactionData])
        .select()
        .single();

      if (transactionError) {
        throw new Error('Failed to save transaction: ' + transactionError.message);
      }

      // Update inventory for physical products
      for (const item of cart) {
        if (!item.is_service && item.stock_quantity !== undefined) {
          const newStock = Math.max(0, item.stock_quantity - item.quantity);
          const { error: inventoryError } = await supabase
            .from('pos_inventory')
            .update({
              stock_quantity: newStock
            })
            .eq('id', item.id);

          if (inventoryError) {
            console.error('Failed to update inventory for', item.name, inventoryError);
          }
        }
      }

      // Refresh products to show updated stock
      await fetchData();

      toast({
        title: "Payment successful!",
        description: `Transaction completed for $${total.toFixed(2)}. Receipt: ${transaction.receipt_number}`,
      });

      // Clear cart and close dialog
      clearCart();
      setShowPaymentDialog(false);
      setCashReceived('');

    } catch (error) {
      toast({
        title: "Payment failed",
        description: "Please try again or use a different payment method",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)]">
        
        {/* Left Panel - Products */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="mb-6 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Point of Sale</h1>
              <p className="text-gray-600">Process sales and manage transactions</p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate('/staff-portal/pos/manage')}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Manage
            </Button>
          </div>

          {/* Search and Categories */}
          <div className="mb-6 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search products or scan barcode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <Button
                  key={category.slug}
                  variant={selectedCategory === category.name ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.name)}
                >
                  {category.name}
                </Button>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const dayPass = products.find(p => p.name === 'Day Pass');
                  if (dayPass) addToCart(dayPass);
                }}
                className="text-xs"
                disabled={!products.find(p => p.name === 'Day Pass')}
              >
                <Clock className="mr-1 h-3 w-3" />
                Day Pass
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const ptSession = products.find(p => p.name === 'Personal Training Session');
                  if (ptSession) addToCart(ptSession);
                }}
                className="text-xs"
                disabled={!products.find(p => p.name === 'Personal Training Session')}
              >
                <UserCog className="mr-1 h-3 w-3" />
                PT Session
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const proteinShake = products.find(p => p.name === 'Protein Shake');
                  if (proteinShake) addToCart(proteinShake);
                }}
                className="text-xs"
                disabled={!products.find(p => p.name === 'Protein Shake')}
              >
                <Package className="mr-1 h-3 w-3" />
                Protein
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const waterBottle = products.find(p => p.name === 'Water Bottle');
                  if (waterBottle) addToCart(waterBottle);
                }}
                className="text-xs"
                disabled={!products.find(p => p.name === 'Water Bottle')}
              >
                <Gift className="mr-1 h-3 w-3" />
                Bottle
              </Button>
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="aspect-square bg-gray-200 rounded-lg mb-3"></div>
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded mb-2"></div>
                      <div className="flex justify-between">
                        <div className="h-4 bg-gray-200 rounded w-16"></div>
                        <div className="h-4 bg-gray-200 rounded w-12"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredProducts.map(product => {
                  const IconComponent = getIconComponent(product.icon_name);
                  const isLowStock = !product.is_service && product.stock_quantity <= product.low_stock_threshold;

                  return (
                    <motion.div
                      key={product.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Card
                        className={`cursor-pointer hover:shadow-md transition-shadow ${
                          isLowStock ? 'border-orange-200 bg-orange-50' : ''
                        }`}
                        onClick={() => addToCart(product)}
                      >
                        <CardContent className="p-4">
                          <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                            <IconComponent className={`h-8 w-8 ${
                              product.category?.color ? `text-[${product.category.color}]` : 'text-gray-400'
                            }`} />
                          </div>
                          <h3 className="font-semibold text-sm mb-1 line-clamp-2">{product.name}</h3>
                          <p className="text-xs text-gray-500 mb-2">{product.category?.name || 'Uncategorized'}</p>
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-green-600">${parseFloat(product.price).toFixed(2)}</span>
                            {product.is_service ? (
                              <Badge variant="secondary" className="text-xs">
                                Service
                              </Badge>
                            ) : (
                              <Badge
                                variant={isLowStock ? "destructive" : "outline"}
                                className="text-xs"
                              >
                                {product.stock_quantity} left
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Cart */}
        <div className="w-full lg:w-96 flex flex-col">
          <Card className="flex-1 flex flex-col border-2 border-indigo-200 shadow-lg bg-gradient-to-b from-indigo-50/30 to-white">
            <CardHeader className="border-b-2 border-indigo-100 bg-gradient-to-r from-indigo-100 to-purple-100">
              <CardTitle className="flex items-center justify-between text-indigo-900">
                <span className="flex items-center">
                  <ShoppingCart className="mr-2 h-6 w-6 text-indigo-600" />
                  <span className="text-lg font-bold">Cart ({cart.length})</span>
                </span>
                {cart.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearCart} className="hover:bg-red-100 text-red-600 hover:text-red-700">
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col p-0">
              {/* Customer Selection */}
              <div className="p-4 border-b-2 border-indigo-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                {customer ? (
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-indigo-200 shadow-sm">
                    <div>
                      <p className="font-semibold text-sm text-indigo-900">{customer.first_name} {customer.last_name}</p>
                      <p className="text-xs text-indigo-600">{customer.email}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCustomer(null)}
                      className="hover:bg-red-100 text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setShowCustomerSearch(true)}
                    >
                      <Users className="mr-2 h-4 w-4" />
                      Select Customer
                    </Button>

                    <div className="text-center text-xs text-gray-500">or</div>

                    <div className="space-y-2">
                      <Input
                        placeholder="Guest name (optional)"
                        value={guestInfo.name}
                        onChange={(e) => setGuestInfo(prev => ({ ...prev, name: e.target.value }))}
                        className="text-sm"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder="Email"
                          type="email"
                          value={guestInfo.email}
                          onChange={(e) => setGuestInfo(prev => ({ ...prev, email: e.target.value }))}
                          className="text-sm"
                        />
                        <Input
                          placeholder="Phone"
                          type="tel"
                          value={guestInfo.phone}
                          onChange={(e) => setGuestInfo(prev => ({ ...prev, phone: e.target.value }))}
                          className="text-sm"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-white to-indigo-50/20">
                {cart.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="bg-indigo-100 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                      <ShoppingCart className="h-10 w-10 text-indigo-400" />
                    </div>
                    <p className="text-indigo-600 font-medium">Cart is empty</p>
                    <p className="text-sm text-indigo-400">Add products to get started</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cart.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-4 bg-white rounded-lg border border-indigo-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm text-gray-900">{item.name}</h4>
                          <p className="text-xs text-indigo-600 font-medium">${parseFloat(item.price).toFixed(2)} each</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeFromCart(item.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Cart Summary */}
              {cart.length > 0 && (
                <div className="border-t-2 border-indigo-200 p-4 space-y-4 bg-gradient-to-r from-indigo-50 to-purple-50">
                  <div className="space-y-3 p-4 bg-white rounded-lg border border-indigo-200 shadow-sm">
                    <div className="flex justify-between text-sm font-medium text-gray-700">
                      <span>Subtotal:</span>
                      <span className="text-indigo-600">${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-medium text-gray-700">
                      <span>Tax (8%):</span>
                      <span className="text-indigo-600">${tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-xl border-t-2 border-indigo-100 pt-3">
                      <span className="text-indigo-900">Total:</span>
                      <span className="text-indigo-900">${total.toFixed(2)}</span>
                    </div>
                  </div>

                  <Button
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                    size="lg"
                    onClick={() => setShowPaymentDialog(true)}
                  >
                    <CreditCard className="mr-2 h-5 w-5" />
                    Process Payment
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Process Payment</DialogTitle>
            <DialogDescription>
              Complete the transaction for ${total.toFixed(2)}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Tabs value={paymentMethod} onValueChange={setPaymentMethod}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="card">Card</TabsTrigger>
                <TabsTrigger value="cash">Cash</TabsTrigger>
              </TabsList>
              
              <TabsContent value="card" className="space-y-4">
                <p className="text-sm text-gray-600">
                  Insert, swipe, or tap card on the payment terminal
                </p>
              </TabsContent>
              
              <TabsContent value="cash" className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Cash Received</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                  />
                  {cashReceived && (
                    <p className="text-sm text-gray-600 mt-1">
                      Change: ${Math.max(0, parseFloat(cashReceived) - total).toFixed(2)}
                    </p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={processPayment}
              disabled={isProcessing || (paymentMethod === 'cash' && parseFloat(cashReceived) < total)}
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Complete Sale
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Customer Search Dialog */}
      <Dialog open={showCustomerSearch} onOpenChange={setShowCustomerSearch}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select Customer</DialogTitle>
            <DialogDescription>
              Search for a customer to associate with this transaction
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Input
              placeholder="Search by name, email, or phone..."
              onChange={async (e) => {
                const query = e.target.value;
                if (query.length > 2) {
                  const results = await searchCustomer(query);
                  // You would set search results state here
                  console.log('Search results:', results);
                }
              }}
            />

            {/* Search results would go here */}
            <div className="text-center py-4 text-gray-500">
              <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">Type to search for customers</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCustomerSearch(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShowCustomerSearch(false)}>
              Continue without Customer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PointOfSale;
