// 🛠️ POS MANAGEMENT - Configure products, categories, and POS settings
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Package, Plus, Edit, Trash2, Settings, BarChart3,
  Search, Filter, Eye, DollarSign, TrendingUp, AlertTriangle,
  ArrowLeft, ShoppingCart
} from 'lucide-react';

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

// Hooks and Services
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';

const POSManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  // State management
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Modal states
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showEditCategory, setShowEditCategory] = useState(false);
  const [showEditProduct, setShowEditProduct] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form states
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    icon_name: 'Package',
    color: '#3B82F6'
  });

  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    category_id: '',
    price: '',
    cogs: '',
    stock_quantity: '',
    low_stock_threshold: '5',
    barcode: '',
    sku: '',
    is_service: false,
    icon_name: 'Package'
  });

  // Fetch all POS data
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('pos_categories')
        .select('*')
        .order('display_order');
      
      if (categoriesError) {
        console.error('POS Management - Categories error:', categoriesError);
        throw categoriesError;
      }

      // Fetch products
      const { data: productsData, error: productsError } = await supabase
        .from('pos_inventory')
        .select('*')
        .order('name');

      if (productsError) {
        console.error('POS Management - Products error:', productsError);
        throw productsError;
      }

      // Enrich products with category data
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
      
      // Fetch recent transactions (simplified without joins for now)
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('transaction_type', 'pos')
        .order('created_at', { ascending: false })
        .limit(50);

      // Enrich transactions with staff and customer data
      let enrichedTransactions = transactionsData || [];
      if (transactionsData && transactionsData.length > 0) {
        // Get unique staff and customer IDs
        const staffIds = [...new Set(transactionsData.map(t => t.staff_id).filter(Boolean))];
        const customerIds = [...new Set(transactionsData.map(t => t.customer_id).filter(Boolean))];

        // Fetch staff profiles
        let staffProfiles = [];
        if (staffIds.length > 0) {
          const { data: staffData } = await supabase
            .from('profiles')
            .select('id, first_name, last_name')
            .in('id', staffIds);
          staffProfiles = staffData || [];
        }

        // Fetch customer profiles
        let customerProfiles = [];
        if (customerIds.length > 0) {
          const { data: customerData } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, email')
            .in('id', customerIds);
          customerProfiles = customerData || [];
        }

        // Enrich transactions
        enrichedTransactions = transactionsData.map(transaction => ({
          ...transaction,
          staff: staffProfiles.find(s => s.id === transaction.staff_id) || null,
          customer: customerProfiles.find(c => c.id === transaction.customer_id) || null
        }));
      }
      
      if (transactionsError) {
        console.error('POS Management - Transactions error:', transactionsError);
        throw transactionsError;
      }

      console.log('POS Management - Fetched categories:', categoriesData);
      console.log('POS Management - Fetched products:', productsData);
      console.log('POS Management - Enriched products:', enrichedProducts);
      console.log('POS Management - Fetched transactions:', transactionsData);
      console.log('POS Management - Enriched transactions:', enrichedTransactions);

      setCategories(categoriesData || []);
      setProducts(enrichedProducts);
      setTransactions(enrichedTransactions);
      
    } catch (error) {
      console.error('Error fetching POS data:', error);
      toast({
        title: "Error loading data",
        description: "Failed to load POS management data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Category operations
  const handleAddCategory = async () => {
    try {
      const { data, error } = await supabase
        .from('pos_categories')
        .insert([{
          ...categoryForm,
          slug: categoryForm.name.toLowerCase().replace(/\s+/g, '-'),
          display_order: categories.length
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Category added",
        description: `${categoryForm.name} has been added successfully`,
      });

      setShowAddCategory(false);
      setCategoryForm({ name: '', description: '', icon_name: 'Package', color: '#3B82F6' });
      fetchData();
    } catch (error) {
      console.error('Error adding category:', error);
      toast({
        title: "Error",
        description: "Failed to add category",
        variant: "destructive"
      });
    }
  };

  const handleEditCategory = async () => {
    try {
      const { error } = await supabase
        .from('pos_categories')
        .update({
          ...categoryForm,
          slug: categoryForm.name.toLowerCase().replace(/\s+/g, '-')
        })
        .eq('id', editingItem.id);

      if (error) throw error;

      toast({
        title: "Category updated",
        description: `${categoryForm.name} has been updated successfully`,
      });

      setShowEditCategory(false);
      setEditingItem(null);
      setCategoryForm({ name: '', description: '', icon_name: 'Package', color: '#3B82F6' });
      fetchData();
    } catch (error) {
      console.error('Error updating category:', error);
      toast({
        title: "Error",
        description: "Failed to update category",
        variant: "destructive"
      });
    }
  };

  // Product operations
  const handleAddProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('pos_inventory')
        .insert([{
          ...productForm,
          price: parseFloat(productForm.price),
          cogs: productForm.cogs ? parseFloat(productForm.cogs) : null,
          stock_quantity: parseInt(productForm.stock_quantity) || 0,
          low_stock_threshold: parseInt(productForm.low_stock_threshold) || 5
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Product added",
        description: `${productForm.name} has been added successfully`,
      });

      setShowAddProduct(false);
      setProductForm({
        name: '', description: '', category_id: '', price: '', cogs: '',
        stock_quantity: '', low_stock_threshold: '5', barcode: '', sku: '',
        is_service: false, icon_name: 'Package'
      });
      fetchData();
    } catch (error) {
      console.error('Error adding product:', error);
      toast({
        title: "Error",
        description: "Failed to add product",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (product.sku && product.sku.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' ||
                           (product.category && product.category.slug === selectedCategory);
    return matchesSearch && matchesCategory;
  });

  // Calculate stats
  const stats = {
    totalProducts: products.length,
    activeProducts: products.filter(p => p.is_active).length,
    lowStockProducts: products.filter(p => !p.is_service && p.stock_quantity <= p.low_stock_threshold).length,
    totalTransactions: transactions.length,
    todayRevenue: transactions
      .filter(t => new Date(t.created_at).toDateString() === new Date().toDateString())
      .reduce((sum, t) => sum + parseFloat(t.total_amount), 0)
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">POS Management</h1>
          <p className="text-gray-600">Manage products, categories, and view transaction history</p>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate('/staff-portal/pos')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to POS
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Products</p>
                <p className="text-2xl font-bold">{stats.totalProducts}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Products</p>
                <p className="text-2xl font-bold text-green-600">{stats.activeProducts}</p>
              </div>
              <Eye className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-orange-600">{stats.lowStockProducts}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Transactions</p>
                <p className="text-2xl font-bold">{stats.totalTransactions}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today's Revenue</p>
                <p className="text-2xl font-bold text-green-600">${stats.todayRevenue.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="products" className="space-y-6">
        <TabsList>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category.slug} value={category.slug}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <Button onClick={() => setShowAddProduct(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    [...Array(5)].map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                        <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                        <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                        <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                        <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                        <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                      </TableRow>
                    ))
                  ) : (
                    filteredProducts.map(product => {
                      const isLowStock = !product.is_service && product.stock_quantity <= product.low_stock_threshold;
                      
                      return (
                        <TableRow key={product.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-sm text-gray-500">{product.sku}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {product.category?.name || 'Uncategorized'}
                            </Badge>
                          </TableCell>
                          <TableCell>${product.price}</TableCell>
                          <TableCell>
                            {product.is_service ? (
                              <Badge variant="secondary">Service</Badge>
                            ) : (
                              <Badge variant={isLowStock ? "destructive" : "outline"}>
                                {product.stock_quantity}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={product.is_active ? "default" : "secondary"}>
                              {product.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingItem(product);
                                  setProductForm({
                                    name: product.name,
                                    description: product.description || '',
                                    category_id: product.category_id,
                                    price: product.price.toString(),
                                    cogs: product.cogs?.toString() || '',
                                    stock_quantity: product.stock_quantity.toString(),
                                    low_stock_threshold: product.low_stock_threshold.toString(),
                                    barcode: product.barcode || '',
                                    sku: product.sku || '',
                                    is_service: product.is_service,
                                    icon_name: product.icon_name || 'Package'
                                  });
                                  setShowEditProduct(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Product Categories</h3>
            <Button onClick={() => setShowAddCategory(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map(category => (
              <Card key={category.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{category.name}</h4>
                    <Badge variant={category.is_active ? "default" : "secondary"}>
                      {category.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{category.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                      {products.filter(p => p.category?.slug === category.slug).length} products
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingItem(category);
                        setCategoryForm({
                          name: category.name,
                          description: category.description || '',
                          icon_name: category.icon_name || 'Package',
                          color: category.color || '#3B82F6'
                        });
                        setShowEditCategory(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <h3 className="text-lg font-semibold">Recent Transactions</h3>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by receipt #, customer..."
                  className="pl-10 w-64"
                />
              </div>
              <Button onClick={() => toast({ title: "Coming Soon", description: "Full transaction history will be available soon" })}>
                View All
              </Button>
            </div>
          </div>
          
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Staff</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.slice(0, 10).map(transaction => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-mono text-sm">
                        {transaction.receipt_number || transaction.transaction_number}
                      </TableCell>
                      <TableCell>
                        {transaction.customer ?
                          `${transaction.customer.first_name} ${transaction.customer.last_name}` :
                          transaction.guest_name ?
                            <div>
                              <span className="font-medium">{transaction.guest_name}</span>
                              <Badge variant="outline" className="ml-2">Guest</Badge>
                            </div> :
                            <Badge variant="outline">Anonymous</Badge>
                        }
                      </TableCell>
                      <TableCell>
                        {transaction.staff ? 
                          `${transaction.staff.first_name} ${transaction.staff.last_name}` : 
                          'Unknown'
                        }
                      </TableCell>
                      <TableCell className="font-semibold">
                        ${transaction.total_amount}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {transaction.payment_method}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(transaction.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toast({ title: "Coming Soon", description: "Transaction details will be available soon" })}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>POS Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">POS configuration settings will be available here.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Tax Rate (%)</label>
                  <Input type="number" placeholder="8.0" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Low Stock Threshold</label>
                  <Input type="number" placeholder="5" />
                </div>
              </div>
              <Button>Save Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Category Modal */}
      <Dialog open={showAddCategory} onOpenChange={setShowAddCategory}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
            <DialogDescription>
              Create a new product category for your POS system.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="category-name">Category Name</Label>
              <Input
                id="category-name"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Supplements"
              />
            </div>

            <div>
              <Label htmlFor="category-description">Description</Label>
              <Textarea
                id="category-description"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of this category"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category-icon">Icon</Label>
                <select
                  id="category-icon"
                  value={categoryForm.icon_name}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, icon_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="Package">Package</option>
                  <option value="Milk">Protein Bottle</option>
                  <option value="Shirt">Shirt</option>
                  <option value="Glasses">Sunglasses</option>
                  <option value="UserCheck">User Check</option>
                  <option value="CreditCard">Credit Card</option>
                </select>
              </div>

              <div>
                <Label htmlFor="category-color">Color</Label>
                <Input
                  id="category-color"
                  type="color"
                  value={categoryForm.color}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, color: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddCategory(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCategory} disabled={!categoryForm.name}>
              Add Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Modal */}
      <Dialog open={showEditCategory} onOpenChange={setShowEditCategory}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update the category information.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-category-name">Category Name</Label>
              <Input
                id="edit-category-name"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Supplements"
              />
            </div>

            <div>
              <Label htmlFor="edit-category-description">Description</Label>
              <Textarea
                id="edit-category-description"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of this category"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-category-icon">Icon</Label>
                <select
                  id="edit-category-icon"
                  value={categoryForm.icon_name}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, icon_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="Package">Package</option>
                  <option value="Milk">Protein Bottle</option>
                  <option value="Shirt">Shirt</option>
                  <option value="Glasses">Sunglasses</option>
                  <option value="UserCheck">User Check</option>
                  <option value="CreditCard">Credit Card</option>
                </select>
              </div>

              <div>
                <Label htmlFor="edit-category-color">Color</Label>
                <Input
                  id="edit-category-color"
                  type="color"
                  value={categoryForm.color}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, color: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditCategory(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditCategory} disabled={!categoryForm.name}>
              Update Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Product Modal */}
      <Dialog open={showAddProduct} onOpenChange={setShowAddProduct}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
            <DialogDescription>
              Create a new product for your POS system.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="product-name">Product Name</Label>
                <Input
                  id="product-name"
                  value={productForm.name}
                  onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Protein Shake"
                />
              </div>

              <div>
                <Label htmlFor="product-category">Category</Label>
                <select
                  id="product-category"
                  value={productForm.category_id}
                  onChange={(e) => setProductForm(prev => ({ ...prev, category_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select Category</option>
                  {categories.filter(c => c.slug !== 'all').map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="product-description">Description</Label>
              <Textarea
                id="product-description"
                value={productForm.description}
                onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Product description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="product-price">Price ($)</Label>
                <Input
                  id="product-price"
                  type="number"
                  step="0.01"
                  value={productForm.price}
                  onChange={(e) => setProductForm(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label htmlFor="product-cogs">Cost of Goods Sold ($)</Label>
                <Input
                  id="product-cogs"
                  type="number"
                  step="0.01"
                  value={productForm.cogs}
                  onChange={(e) => setProductForm(prev => ({ ...prev, cogs: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="product-stock">Stock Quantity</Label>
                <Input
                  id="product-stock"
                  type="number"
                  value={productForm.stock_quantity}
                  onChange={(e) => setProductForm(prev => ({ ...prev, stock_quantity: e.target.value }))}
                  placeholder="0"
                  disabled={productForm.is_service}
                />
              </div>

              <div>
                <Label htmlFor="product-threshold">Low Stock Threshold</Label>
                <Input
                  id="product-threshold"
                  type="number"
                  value={productForm.low_stock_threshold}
                  onChange={(e) => setProductForm(prev => ({ ...prev, low_stock_threshold: e.target.value }))}
                  placeholder="5"
                  disabled={productForm.is_service}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="product-barcode">Barcode</Label>
                <Input
                  id="product-barcode"
                  value={productForm.barcode}
                  onChange={(e) => setProductForm(prev => ({ ...prev, barcode: e.target.value }))}
                  placeholder="Optional"
                />
              </div>

              <div>
                <Label htmlFor="product-sku">SKU</Label>
                <Input
                  id="product-sku"
                  value={productForm.sku}
                  onChange={(e) => setProductForm(prev => ({ ...prev, sku: e.target.value }))}
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="product-icon">Icon</Label>
                <select
                  id="product-icon"
                  value={productForm.icon_name}
                  onChange={(e) => setProductForm(prev => ({ ...prev, icon_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="Package">Package</option>
                  <option value="Coffee">Coffee/Shake</option>
                  <option value="Shirt">Shirt</option>
                  <option value="Glasses">Glasses</option>
                  <option value="UserCheck">User Check</option>
                  <option value="Zap">Energy</option>
                  <option value="Apple">Apple</option>
                  <option value="Ticket">Ticket</option>
                </select>
              </div>

              <div className="flex items-center space-x-2 pt-6">
                <Checkbox
                  id="product-service"
                  checked={productForm.is_service}
                  onCheckedChange={(checked) => setProductForm(prev => ({ ...prev, is_service: checked }))}
                />
                <Label htmlFor="product-service">This is a service (unlimited stock)</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddProduct(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddProduct}
              disabled={!productForm.name || !productForm.price || !productForm.category_id}
            >
              Add Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Product Modal */}
      <Dialog open={showEditProduct} onOpenChange={setShowEditProduct}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update the product information.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-product-name">Product Name</Label>
                <Input
                  id="edit-product-name"
                  value={productForm.name}
                  onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Protein Shake"
                />
              </div>

              <div>
                <Label htmlFor="edit-product-category">Category</Label>
                <select
                  id="edit-product-category"
                  value={productForm.category_id}
                  onChange={(e) => setProductForm(prev => ({ ...prev, category_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select Category</option>
                  {categories.filter(c => c.slug !== 'all').map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="edit-product-description">Description</Label>
              <Textarea
                id="edit-product-description"
                value={productForm.description}
                onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Product description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-product-price">Price ($)</Label>
                <Input
                  id="edit-product-price"
                  type="number"
                  step="0.01"
                  value={productForm.price}
                  onChange={(e) => setProductForm(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label htmlFor="edit-product-cogs">Cost of Goods Sold ($)</Label>
                <Input
                  id="edit-product-cogs"
                  type="number"
                  step="0.01"
                  value={productForm.cogs}
                  onChange={(e) => setProductForm(prev => ({ ...prev, cogs: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-product-stock">Stock Quantity</Label>
                <Input
                  id="edit-product-stock"
                  type="number"
                  value={productForm.stock_quantity}
                  onChange={(e) => setProductForm(prev => ({ ...prev, stock_quantity: e.target.value }))}
                  placeholder="0"
                  disabled={productForm.is_service}
                />
              </div>

              <div>
                <Label htmlFor="edit-product-threshold">Low Stock Threshold</Label>
                <Input
                  id="edit-product-threshold"
                  type="number"
                  value={productForm.low_stock_threshold}
                  onChange={(e) => setProductForm(prev => ({ ...prev, low_stock_threshold: e.target.value }))}
                  placeholder="5"
                  disabled={productForm.is_service}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-product-barcode">Barcode</Label>
                <Input
                  id="edit-product-barcode"
                  value={productForm.barcode}
                  onChange={(e) => setProductForm(prev => ({ ...prev, barcode: e.target.value }))}
                  placeholder="Optional"
                />
              </div>

              <div>
                <Label htmlFor="edit-product-sku">SKU</Label>
                <Input
                  id="edit-product-sku"
                  value={productForm.sku}
                  onChange={(e) => setProductForm(prev => ({ ...prev, sku: e.target.value }))}
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-product-icon">Icon</Label>
                <select
                  id="edit-product-icon"
                  value={productForm.icon_name}
                  onChange={(e) => setProductForm(prev => ({ ...prev, icon_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="Package">Package</option>
                  <option value="Coffee">Coffee/Shake</option>
                  <option value="Shirt">Shirt</option>
                  <option value="Glasses">Glasses</option>
                  <option value="UserCheck">User Check</option>
                  <option value="Zap">Energy</option>
                  <option value="Apple">Apple</option>
                  <option value="Ticket">Ticket</option>
                </select>
              </div>

              <div className="flex items-center space-x-2 pt-6">
                <Checkbox
                  id="edit-product-service"
                  checked={productForm.is_service}
                  onCheckedChange={(checked) => setProductForm(prev => ({ ...prev, is_service: checked }))}
                />
                <Label htmlFor="edit-product-service">This is a service (unlimited stock)</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditProduct(false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                try {
                  const { error } = await supabase
                    .from('pos_inventory')
                    .update({
                      ...productForm,
                      price: parseFloat(productForm.price),
                      cogs: productForm.cogs ? parseFloat(productForm.cogs) : null,
                      stock_quantity: parseInt(productForm.stock_quantity) || 0,
                      low_stock_threshold: parseInt(productForm.low_stock_threshold) || 5
                    })
                    .eq('id', editingItem.id);

                  if (error) throw error;

                  toast({
                    title: "Product updated",
                    description: `${productForm.name} has been updated successfully`,
                  });

                  setShowEditProduct(false);
                  setEditingItem(null);
                  setProductForm({
                    name: '', description: '', category_id: '', price: '', cogs: '',
                    stock_quantity: '', low_stock_threshold: '5', barcode: '', sku: '',
                    is_service: false, icon_name: 'Package'
                  });
                  fetchData();
                } catch (error) {
                  console.error('Error updating product:', error);
                  toast({
                    title: "Error",
                    description: "Failed to update product",
                    variant: "destructive"
                  });
                }
              }}
              disabled={!productForm.name || !productForm.price || !productForm.category_id}
            >
              Update Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default POSManagement;
