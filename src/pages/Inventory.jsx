import React, { useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { 
    Search, Plus, Filter, Download, 
    MoreVertical, Settings, ExternalLink, 
    Box, TrendingUp, Package,
    ChevronDown, X, Pencil, FileText,
    Tag, IndianRupee, Database, ChevronRight,
    LayoutGrid, List, AlertCircle, Trash2, Eye
} from 'lucide-react';
import Pagination from '../components/shared/Pagination';
import Swal from 'sweetalert2';
import xlsx from 'json-as-xlsx';
import api from '../lib/axios';
import { cn } from '../lib/utils';

import useUserPermissions from '../hooks/useUserPermissions';

const gstOptions = [
    "None", "Exempted", "GST @ 0%", "GST @ 0.1%", "GST @ 0.25%", "GST @ 1.5%",
    "GST @ 3%", "GST @ 5%", "GST @ 6%", "GST @ 8.9%", "GST @ 12%", "GST @ 13.8%",
    "GST @ 18%", "GST @ 14% + cess @ 12%", "GST @ 28%", "GST @ 28% + Cess @ 5%",
    "GST @ 40%", "GST @ 28% + Cess @ 36%", "GST @ 28% + Cess @ 60%"
];

const Inventory = () => {
    const { canCreate, canEdit, canDelete } = useUserPermissions('Items');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false); // New state for View Modal
  const [categoryName, setCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [showReportsDropdown, setShowReportsDropdown] = useState(false);
  const [loading, setLoading] = useState(true);

  // Item Form State
  const [isEditingItem, setIsEditingItem] = useState(false);
  const [itemFormData, setItemFormData] = useState({
      name: '',
      code: '',
      category: '',
      unit: 'PCS',
      stock: 0,
      minStock: 5,
      purchasePrice: 0,
      sellingPrice: 0,
      mrp: 0,
      wholesalePrice: 0,
      description: '',
      gstRate: 'None'
  });
  
  // State for Viewing Item
  const [viewedItem, setViewedItem] = useState(null);

  const [items, setItems] = useState([]);
  const [godowns, setGodowns] = useState([]);
  const [categories, setCategories] = useState([]);
  
  // ... (fetchItems logic remains as it was updated in previous step) ...



  const fetchItems = async () => {
    setLoading(true);
    try {
      const [itemsRes, catsRes, godownsRes] = await Promise.all([
        api.get('/items'),
        api.get('/item-categories'),
        api.get('/godowns')
      ]);
      
      const itemsData = itemsRes.data;
      const backendCats = catsRes.data;
      setGodowns(godownsRes.data); // Store fetched Godowns
      
      setItems(itemsData);
      
      // Extract unique categories from items to get counts
      const itemCats = {};
      itemsData.forEach(item => {
        const cat = item.category || 'Uncategorized';
        itemCats[cat] = (itemCats[cat] || 0) + 1;
      });
      
      // Combine backend categories with item-derived ones
      const finalCats = backendCats.map(cat => ({
        id: cat._id,
        name: cat.name,
        count: itemCats[cat.name] || 0
      }));

      // Add 'Uncategorized' if not present but has items
      if (itemCats['Uncategorized'] && !finalCats.find(c => c.name === 'Uncategorized')) {
          finalCats.push({ id: 'uncat', name: 'Uncategorized', count: itemCats['Uncategorized'] });
      }

      // Add any other categories that are in items but not in backend
      Object.entries(itemCats).forEach(([name, count]) => {
          if (name !== 'Uncategorized' && !finalCats.find(c => c.name === name)) {
              finalCats.push({ id: 'adhoc-' + name, name, count });
          }
      });

      setCategories(finalCats);

    } catch (error) {
      console.error('Error fetching inventory:', error);
      Swal.fire('Error', 'Failed to fetch inventory', 'error');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchItems();
  }, []);

  const itemsPerPage = 8;
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('All Categories');

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (item.code && item.code.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'All Categories' || item.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const currentItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Dynamic Stats
  const stockValuation = items.reduce((sum, item) => {
    const stock = parseFloat(item.stock) || 0;
    const price = parseFloat(item.purchasePrice) || 0;
    return sum + (stock * price);
  }, 0);

  const lowStockCount = items.filter(item => {
    const stock = parseFloat(item.stock) || 0;
    const minStock = parseFloat(item.minStock) || 5;
    return stock <= minStock;
  }).length;

  const handleSaveCategory = async () => {
    const trimmedCategory = categoryName.trim();
    
    if (!trimmedCategory) {
        Swal.fire('Error', 'Category Name is required', 'error');
        return;
    }

    // Block purely numeric or special character names (require at least one letter)
    if (!/[a-zA-Z]/.test(trimmedCategory)) {
        Swal.fire('Error', 'Category Name must contain at least one letter and cannot be purely numeric', 'error');
        return;
    }

    if (trimmedCategory.length < 2) {
        Swal.fire('Error', 'Category Name must be at least 2 characters long', 'error');
        return;
    }

    const exists = categories.some(c => c.name.toLowerCase() === trimmedCategory.toLowerCase());
    if (exists) {
        Swal.fire('Error', 'Category already exists', 'error');
        return;
    }
    
    try {
        if (editingCategory) {
            // If it's an adhoc category, we should POST (create) it rather than PUT (update)
            // since it doesn't exist in the backend ItemCategory collection yet.
            if (editingCategory.id.toString().startsWith('adhoc-')) {
                const response = await api.post('/item-categories', { name: trimmedCategory });
                setCategories(prev => prev.map(c => c.id === editingCategory.id ? { ...c, id: response.data._id, name: response.data.name } : c));
                Swal.fire('Success', 'Category created from ad-hoc entry', 'success');
            } else {
                const response = await api.put(`/item-categories/${editingCategory.id}`, { name: trimmedCategory });
                setCategories(prev => prev.map(c => c.id === editingCategory.id ? { ...c, name: response.data.name } : c));
                Swal.fire('Success', 'Category updated successfully', 'success');
            }
        } else {
            const response = await api.post('/item-categories', { name: trimmedCategory });
            // Update local state to show in dropdowns immediately
            setCategories(prev => [...prev, { id: response.data._id, name: response.data.name, count: 0 }]);
            Swal.fire('Success', 'Category added successfully', 'success');
        }

        setShowCategoryModal(false);
        setCategoryName('');
        setEditingCategory(null);
    } catch (error) {
        console.error('Error saving category:', error);
        Swal.fire('Error', error.response?.data?.message || 'Failed to save category', 'error');
    }
  };

  const handleDeleteCategory = async (cat) => {
    // Prevent deleting 'Uncategorized' if it's protected or adhoc categories
    if (cat.id === 'uncat' || cat.id.toString().startsWith('adhoc-')) {
        Swal.fire('Error', 'This category cannot be deleted as it is a default or ad-hoc category.', 'error');
        return;
    }

    const result = await Swal.fire({
        title: 'Are you sure?',
        text: `Do you want to delete "${cat.name}"? This will not delete the items in it.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#000000',
        confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
        try {
            await api.delete(`/item-categories/${cat.id}`);
            setCategories(prev => prev.filter(c => c.id !== cat.id));
            Swal.fire('Deleted!', 'Category has been removed.', 'success');
        } catch (error) {
            console.error('Error deleting category:', error);
            Swal.fire('Error', 'Failed to delete category', 'error');
        }
    }
  };

  const startEditCategory = (cat) => {
    setEditingCategory(cat);
    setCategoryName(cat.name);
  };

  // --- Item Management Functions ---

  // --- Item Management Functions ---
  const handleAddItem = () => {
      setIsEditingItem(false);
      setItemFormData({
        name: '', code: '', category: '', godown: '', unit: 'PCS',
        stock: 0, minStock: 5, purchasePrice: 0,
        sellingPrice: 0, mrp: 0, wholesalePrice: 0, description: '', gstRate: 'None', hsn: ''
      });
      setShowItemModal(true);
  };

  const handleEditItem = (item) => {
      setIsEditingItem(true);
      setItemFormData({ ...item });
      setShowItemModal(true);
  };
  
  const handleViewItem = (item) => {
      setViewedItem(item);
      setShowViewModal(true);
  };

  const getStockStyle = (stock, minStock) => {
    if (stock < 0) return 'bg-red-600 text-white border-red-700';
    if (stock <= (minStock || 5)) return 'bg-orange-50 text-orange-600 border-orange-100';
    return 'bg-green-50 text-green-600 border-green-100';
  };

  const handleSaveItem = async () => {
      const trimmedName = itemFormData.name.trim();

      if (!trimmedName) {
          Swal.fire('Error', 'Item Name is required', 'error');
          return;
      }

      if (!itemFormData.category) {
          Swal.fire('Warning', 'Please select a Category for the item', 'warning');
          return;
      }
      
      if (!itemFormData.godown) {
          Swal.fire('Warning', 'Please select a Godown Location for the item', 'warning');
          return;
      }

      // Block purely numeric or special character names (require at least one letter)
      if (!/[a-zA-Z]/.test(trimmedName)) {
        Swal.fire('Error', 'Item Name must contain at least one letter (e.g., "Item 654" is fine, but "654" is not)', 'error');
        return;
      }

      if (trimmedName.length < 3) {
        Swal.fire('Error', 'Item Name must be at least 3 characters long', 'error');
        return;
      }

      if (parseFloat(itemFormData.stock) < 0) {
        Swal.fire('Error', 'Stock cannot be negative', 'error');
        return;
      }
      
      if (parseFloat(itemFormData.purchasePrice) < 0 || parseFloat(itemFormData.sellingPrice) < 0) {
        Swal.fire('Error', 'Prices cannot be negative', 'error');
        return;
      }

      try {
          let response;
          if (isEditingItem) {
              response = await api.put(`/items/${itemFormData._id}`, itemFormData);
              setItems(prev => prev.map(i => i._id === itemFormData._id ? response.data : i));
              Swal.fire('Success', 'Item updated successfully', 'success');
          } else {
              response = await api.post('/items', itemFormData);
              setItems(prev => [...prev, response.data]);
              Swal.fire('Success', 'Item created successfully', 'success');
          }
          setShowItemModal(false);
          // Refresh categories in case a new one was added
          fetchItems(); 
      } catch (error) {
          console.error('Error saving item:', error);
          Swal.fire('Error', error.response?.data?.message || 'Failed to save item', 'error');
      }
  };



  const handleDeleteItem = async (id) => {
      const result = await Swal.fire({
          title: 'Are you sure?',
          text: "You won't be able to revert this!",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#000000',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Yes, delete it!'
      });

      if (result.isConfirmed) {
          try {
              await api.delete(`/items/${id}`);
              setItems(prev => prev.filter(i => i._id !== id));
              Swal.fire('Deleted!', 'Item has been deleted.', 'success');
          } catch (error) {
              console.error('Error deleting item:', error);
              Swal.fire('Error', 'Failed to delete item', 'error');
          }
      }
  };

  // --- Reporting Functions ---

  const handleReportDownload = (type) => {
    let columns = [];
    let content = [];
    let fileName = "";

    switch (type) {
      case 'Rate List':
        columns = [
          { label: "Item Name", value: "name" },
          { label: "Item Code", value: "code" },
          { label: "Category", value: "category" },
          { label: "MRP", value: "mrp" },
          { label: "Selling Price", value: "sellingPrice" },
          { label: "Wholesale Price", value: "wholesalePrice" }
        ];
        content = items;
        fileName = "Rate_List_" + new Date().toISOString().split('T')[0];
        break;

      case 'Stock Summary':
        columns = [
          { label: "Item Name", value: "name" },
          { label: "Code", value: "code" },
          { label: "Stock", value: "stock" },
          { label: "Unit", value: "unit" },
          { label: "Purchase Price", value: "purchasePrice" },
          { label: "Total Value", value: "totalValue" }
        ];
        content = items.map(i => ({...i, totalValue: (i.stock || 0) * (i.purchasePrice || 0)}));
        fileName = "Stock_Summary_" + new Date().toISOString().split('T')[0];
        break;

      case 'Low Stock Summary':
        columns = [
          { label: "Item Name", value: "name" },
          { label: "Code", value: "code" },
          { label: "Current Stock", value: "stock" },
          { label: "Min Stock Level", value: "minStock" },
          { label: "Deficit", value: "deficit" }
        ];
        content = items
          .filter(i => i.stock <= (i.minStock || 5))
          .map(i => ({...i, deficit: (i.minStock || 5) - i.stock}));
        fileName = "Low_Stock_Alert_" + new Date().toISOString().split('T')[0];
        break;
        
      default:
        return;
    }

    const data = [{
      sheet: type,
      columns: columns,
      content: content
    }];

    const settings = {
      fileName: fileName,
      extraLength: 3,
      writeOptions: {},
    };

    xlsx(data, settings);
    setShowReportsDropdown(false);
    
    Swal.fire({
      title: 'Report Generated',
      text: `${type} has been downloaded successfully.`,
      icon: 'success',
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000
    });
  };

  const handleDownload = () => {
    const data = [
      {
        sheet: "Inventory",
        columns: [
          { label: "Item Name", value: "name" },
          { label: "Code", value: "code" },
          { label: "Category", value: "category" },
          { label: "Stock", value: "stock" },
          { label: "Unit", value: "unit" },
          { label: "Sale Price", value: "selling" },
          { label: "Purchase Price", value: "purchase" },
          { label: "MRP", value: "mrp" },
          { label: "Wholesale", value: "wholesale" },
        ],
        content: items.map(item => ({
          name: item.name,
          code: item.code,
          tag: item.tag,
          stock: item.stock,
          unit: item.unit,
          selling: item.selling,
          purchase: item.purchase,
          mrp: item.mrp,
          wholesale: item.wholesale
        })),
      },
    ];

    const settings = {
      fileName: "Inventory_Stock_" + new Date().toISOString().split('T')[0],
      extraLength: 3,
      writeOptions: {},
    };

    xlsx(data, settings);
    
    Swal.fire({
      title: 'Success!',
      text: 'Inventory list has been exported to Excel.',
      icon: 'success',
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000
    });
  };

  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight uppercase">Inventory & Stock</h1>
            <p className="text-xs sm:text-sm text-gray-500 font-bold">Manage products, pricing and availability</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              <div className="relative w-full sm:w-auto">
                  <button 
                    onClick={() => setShowReportsDropdown(!showReportsDropdown)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-indigo-600 rounded-xl hover:bg-indigo-50 transition-all font-black text-[10px] uppercase tracking-widest shadow-sm"
                  >
                      <FileText size={16} />
                      Reports
                      <ChevronDown size={14} className={`transition-transform ${showReportsDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  {showReportsDropdown && (
                      <div className="absolute right-0 top-full mt-2 w-full sm:w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                          {['Rate List', 'Stock Summary', 'Low Stock Summary'].map((report) => (
                              <button 
                                key={report} 
                                onClick={() => handleReportDownload(report)}
                                className="w-full text-left px-4 py-3 text-[10px] font-black text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 uppercase tracking-widest border-b border-gray-50 last:border-0"
                              >
                                {report}
                              </button>
                          ))}
                      </div>
                  )}
              </div>
              {canCreate && (
                  <button 
                      onClick={handleAddItem}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-[#000000] text-white rounded-xl shadow-lg shadow-indigo-600/20 hover:bg-[#b4933d] transition-all font-black text-[10px] uppercase tracking-widest"
                  >
                      <Plus size={16} />
                      Add Item
                  </button>
              )}
          </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className={cn(
            "p-5 rounded-2xl shadow-sm flex items-center justify-between group transition-all cursor-pointer border",
            stockValuation < 0 
              ? "bg-red-50 border-red-200 shadow-red-100" 
              : "bg-[#000000] border-gray-100 hover:border-indigo-100 shadow-sm"
          )}>
              <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                    stockValuation < 0 ? "bg-red-100 text-red-600" : "bg-indigo-50 text-indigo-600"
                  )}>
                      {stockValuation < 0 ? <AlertCircle size={20} /> : <TrendingUp size={20} />}
                  </div>
                  <div>
                      <div className="flex items-center gap-2">
                        <p className={cn(
                          "text-[10px] font-black uppercase tracking-widest",
                          stockValuation < 0 ? "text-red-500" : "text-gray-400"
                        )}>Stock Valuation</p>
                        {stockValuation < 0 && (
                          <span className="bg-red-600 text-[8px] text-white px-1.5 py-0.5 rounded font-black animate-pulse">CRITICAL: CHECK STOCK</span>
                        )}
                      </div>
                      <p className={cn(
                        "text-xl font-bold italic",
                        stockValuation < 0 ? "text-red-700" : "text-white"
                      )}>₹ {stockValuation.toLocaleString()}</p>
                  </div>
              </div>
              <ExternalLink size={16} className={cn(
                "transition-colors",
                stockValuation < 0 ? "text-red-400 group-hover:text-red-600" : "text-gray-300 group-hover:text-indigo-600"
              )} />
          </div>
          <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm flex items-center justify-between group hover:border-orange-100 transition-all cursor-pointer">
              <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                      <AlertCircle size={20} />
                  </div>
                  <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Low Stock Alert</p>
                      <p className="text-xl font-bold text-gray-900 italic">{lowStockCount} Items</p>
                  </div>
              </div>
              <ExternalLink size={16} className="text-gray-300 group-hover:text-orange-600 transition-colors" />
          </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col xl:flex-row gap-4 mb-6">
          <div className="flex-1 flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search by code or item name..." 
                    className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all font-medium text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
              </div>
              <div className="relative group min-w-[200px]">
                  <select 
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full appearance-none pl-4 pr-10 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-600/10 transition-all font-bold text-xs uppercase tracking-widest text-gray-600"
                  >
                      <option>All Categories</option>
                      {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
          </div>
          <div className="flex items-center gap-2 justify-end">
              <button 
                onClick={handleDownload}
                className="px-5 py-3 bg-white border border-gray-200 rounded-xl text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-indigo-600 transition-all shadow-sm flex items-center gap-2"
              >
                  <Download size={16} /> Export
              </button>
              {canEdit && (
                  <button 
                    onClick={() => setShowCategoryModal(true)}
                    className="px-5 py-3 bg-white border border-gray-200 rounded-xl text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-indigo-600 transition-all shadow-sm"
                  >
                      Manage Categories
                  </button>
              )}
          </div>
      </div>

      {/* Desktop View Table */}
      <div className="hidden lg:block bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden mb-8">
          <table className="w-full text-left border-collapse">
              <thead>
                  <tr className="bg-gray-50/50">
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50 italic">Item / Code</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50 italic">Category</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50 italic">HSN</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50 italic">Godown</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50 italic">Stock</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50 italic text-right">Sale Price</th>
                      <th className="px-6 py-4 text-right border-b border-gray-50 w-24"></th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                  {currentItems.map((item) => (
                      <tr key={item._id} className="group hover:bg-indigo-50/20 transition-all">
                          <td className="px-6 py-4">
                              <p className="font-bold text-gray-900 text-sm whitespace-nowrap">{item.name}</p>
                              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest tracking-tighter">Code: {item.code || '-'}</span>
                          </td>
                          <td className="px-6 py-4">
                              <span className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-wider border border-indigo-100">
                                  {item.category || 'Uncategorized'}
                              </span>
                          </td>
                          <td className="px-6 py-4">
                              <span className="text-[11px] font-bold text-gray-600 font-mono italic">{item.hsn || '-'}</span>
                          </td>
                          <td className="px-6 py-4">
                               <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                                  {(() => {
                                      if (!item.godown) return 'Primary';
                                      // Try to match by ID first
                                      const matchedGodown = godowns.find(g => (g._id || g.id) === item.godown);
                                      if (matchedGodown) return matchedGodown.name;
                                      // If no ID match, check if it's stored as name or "Name (Type)"
                                      const godownStr = String(item.godown);
                                      // Extract name from "Name (Type)" format
                                      const nameMatch = godownStr.match(/^(.+?)\s*\(/);
                                      return nameMatch ? nameMatch[1] : godownStr;
                                  })()}
                               </span>
                          </td>
                          <td className="px-6 py-4">
                              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${getStockStyle(item.stock, item.minStock)}`}>
                                  {item.stock} {item.unit}
                              </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                              <div className="flex flex-col items-end">
                                  <p className="font-black text-sm text-gray-900 tabular-nums italic">₹{item.sellingPrice?.toLocaleString()}</p>
                                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">Buy: ₹{item.purchasePrice?.toLocaleString()}</p>
                              </div>
                          </td>
                          <td className="px-6 py-4">
                              <div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => handleViewItem(item)} className="p-2 text-gray-400 hover:text-blue-600 transition-all"><Eye size={16} /></button>
                                  {canEdit && <button onClick={() => handleEditItem(item)} className="p-2 text-gray-400 hover:text-[#000000] transition-all"><Pencil size={16} /></button>}
                                  {canDelete && <button onClick={() => handleDeleteItem(item._id)} className="p-2 text-gray-400 hover:text-red-500 transition-all"><Trash2 size={16} /></button>}
                              </div>
                          </td>
                      </tr>
                  ))}
              </tbody>
          </table>
          <div className="p-4 border-t border-gray-50 bg-gray-50/30">
              <Pagination 
                currentPage={currentPage}
                totalPages={totalPages}
                itemsPerPage={itemsPerPage}
                totalItems={filteredItems.length}
                onPageChange={setCurrentPage}
            />
          </div>
      </div>

      {/* Mobile View Cards */}
      <div className="lg:hidden space-y-3 mb-8">
          {currentItems.map((item) => (
              <div key={item._id} className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm active:scale-[0.98] transition-all">
                  <div className="flex justify-between items-start mb-3">
                      <div className="flex-1 min-w-0 mr-4">
                          <h3 className="font-bold text-gray-900 truncate">{item.name}</h3>
                          <div className="flex flex-wrap items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">#{item.code}</span>
                              <span className="text-[10px] text-emerald-500 font-black uppercase tracking-widest">HSN: {item.hsn || '-'}</span>
                              <span className="text-[10px] text-indigo-500 font-black uppercase tracking-widest">{item.category}</span>
                              <span className="text-[9px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded font-bold uppercase tracking-widest">
                                  {(() => {
                                      if (!item.godown) return 'PRI';
                                      const matchedGodown = godowns.find(g => (g._id || g.id) === item.godown);
                                      if (matchedGodown) return matchedGodown.name.substring(0, 3).toUpperCase();
                                      const godownStr = String(item.godown);
                                      const nameMatch = godownStr.match(/^(.+?)\s*\(/);
                                      const name = nameMatch ? nameMatch[1] : godownStr;
                                      return name.substring(0, 3).toUpperCase();
                                  })()}
                              </span>
                          </div>
                      </div>
                      <span className={`shrink-0 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${getStockStyle(item.stock, item.minStock)}`}>
                          {item.stock} {item.unit}
                      </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 py-3 border-y border-gray-50">
                      <div>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Sale Price</p>
                          <p className="font-bold italic text-gray-900 tabular-nums">₹{item.sellingPrice ? item.sellingPrice.toLocaleString() : 0}</p>
                      </div>
                      <div className="text-right">
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">M.R.P</p>
                          <p className="font-bold italic text-gray-400 line-through tabular-nums">₹{item.mrp ? item.mrp.toLocaleString() : 0}</p>
                      </div>
                  </div>

                  <div className="flex items-center justify-between pt-3">
                      <button className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest">
                          Stock History
                      </button>
                      <div className="flex items-center gap-1">
                          <button onClick={() => handleViewItem(item)} className="p-2 text-gray-400 bg-gray-50 rounded-xl hover:text-blue-600"><Eye size={18} /></button>
                          {canEdit && <button onClick={() => handleEditItem(item)} className="p-2 text-gray-400 bg-gray-50 rounded-xl hover:text-black"><Pencil size={18} /></button>}
                          {canDelete && <button onClick={() => handleDeleteItem(item._id)} className="p-2 text-gray-400 bg-gray-50 rounded-xl active:text-red-500"><Trash2 size={18} /></button>}
                      </div>
                  </div>
              </div>
          ))}
          <div className="pt-4 flex justify-center">
              <Pagination 
                currentPage={currentPage}
                totalPages={totalPages}
                itemsPerPage={itemsPerPage}
                totalItems={filteredItems.length}
                onPageChange={setCurrentPage}
            />
          </div>
      </div>

      {/* Item Add/Edit Modal */}
      {showItemModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
             <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-auto flex flex-col max-h-[90vh]">
                <div className="px-6 py-5 flex justify-between items-center border-b border-gray-50 bg-gray-50/50 shrink-0">
                    <h3 className="text-lg font-bold text-gray-900">{isEditingItem ? 'Edit Item' : 'New Item'}</h3>
                    <button onClick={() => setShowItemModal(false)} className="p-1 rounded-full hover:bg-gray-100 text-gray-400"><X size={20} /></button>
                </div>
                <div className="p-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                         {/* Basic Info */}
                         <div className="md:col-span-2 space-y-5">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                 <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] block mb-2">Item Name <span className="text-red-500">*</span></label>
                                    <input 
                                        type="text" 
                                        value={itemFormData.name}
                                        onChange={(e) => setItemFormData({...itemFormData, name: e.target.value})}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-black focus:border-[#000000] font-bold transition-all text-sm"
                                        placeholder="Enter item name"
                                    />
                                 </div>
                                 <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] block mb-2">Item Code / SKU</label>
                                    <input 
                                        type="text" 
                                        value={itemFormData.code}
                                        onChange={(e) => setItemFormData({...itemFormData, code: e.target.value})}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-black focus:border-[#000000] font-bold transition-all text-sm"
                                        placeholder="Ex: ITEM-001"
                                    />
                                 </div>
                             </div>
                         </div>
                         
                          {/* Category & Godown */}
                          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-5">
                             <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] block mb-2">Category <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <select 
                                        value={itemFormData.category}
                                        onChange={(e) => setItemFormData({...itemFormData, category: e.target.value})}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-black focus:border-[#000000] font-bold transition-all text-sm appearance-none cursor-pointer"
                                    >
                                        <option value="">Select Category</option>
                                        {categories
                                            .filter(c => c.name !== 'All Categories' && c.name !== 'Uncategorized')
                                            .sort((a, b) => a.name.localeCompare(b.name))
                                            .map(c => (
                                                <option key={c.id} value={c.name}>{c.name}</option>
                                            ))
                                        }
                                        <option value="Uncategorized">Uncategorized</option>
                                    </select>
                                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                             </div>
                             <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] block mb-2">Storage Location (Godown) <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <select 
                                        value={itemFormData.godown || ''}
                                        onChange={(e) => setItemFormData({...itemFormData, godown: e.target.value})}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-black focus:border-[#000000] font-bold transition-all text-sm appearance-none cursor-pointer"
                                    >
                                        <option value="">Select Godown</option>
                                        {godowns.map(g => (
                                            <option key={g._id || g.id} value={g._id || g.id}>{g.name} ({g.type || 'Secondary'})</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                             </div>
                         </div>
                         <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] block mb-2">Unit</label>
                            <select 
                                value={itemFormData.unit}
                                onChange={(e) => setItemFormData({...itemFormData, unit: e.target.value})}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-black focus:border-[#000000] font-bold transition-all text-sm"
                            >
                                <option>PCS</option>
                                <option>KG</option>
                                <option>LTR</option>
                                <option>BOX</option>
                                <option>BAG</option>
                                <option>MTR</option>
                            </select>
                         </div>

                         {/* Stock & Low Stock */}
                         <div>
                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] block mb-2">Opening Stock</label>
                             <input 
                                type="number"
                                value={itemFormData.stock === 0 ? '' : itemFormData.stock}
                                onChange={(e) => setItemFormData({...itemFormData, stock: e.target.value})}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-black focus:border-[#000000] font-bold transition-all text-sm"
                                placeholder="0"
                             />
                         </div>
                          <div>
                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] block mb-2">Low Stock Alert Level</label>
                             <input 
                                type="number"
                                value={itemFormData.minStock === 0 ? '' : itemFormData.minStock}
                                onChange={(e) => setItemFormData({...itemFormData, minStock: e.target.value})}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-black focus:border-[#000000] font-bold transition-all text-sm"
                                placeholder="0"
                             />
                          </div>

                          {/* HSN Code */}
                          <div>
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] block mb-2">HSN / SAC Code</label>
                              <input 
                                 type="text"
                                 value={itemFormData.hsn || ''}
                                 onChange={(e) => setItemFormData({...itemFormData, hsn: e.target.value})}
                                 className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-black focus:border-[#000000] font-bold transition-all text-sm"
                                 placeholder="Enter HSN Code"
                              />
                          </div>

                         {/* GST Selection */}
                         <div>
                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] block mb-2">GST Rate</label>
                             <select 
                                value={itemFormData.gstRate || 'None'} 
                                onChange={(e) => setItemFormData({...itemFormData, gstRate: e.target.value})}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-black focus:border-[#000000] font-bold transition-all text-sm"
                             >
                                 {gstOptions.map(rate => <option key={rate} value={rate}>{rate}</option>)}
                             </select>
                         </div>

                         {/* Pricing */}
                         <div>
                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] block mb-2">Purchase Price (Cost)</label>
                             <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
                                <input 
                                    type="number"
                                    value={itemFormData.purchasePrice === 0 ? '' : itemFormData.purchasePrice}
                                    onChange={(e) => setItemFormData({...itemFormData, purchasePrice: e.target.value})}
                                    className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-black focus:border-[#000000] font-bold transition-all text-sm"
                                    placeholder="0"
                                />
                             </div>
                         </div>
                         <div>
                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] block mb-2">Selling Price</label>
                             <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
                                <input 
                                    type="number"
                                    value={itemFormData.sellingPrice === 0 ? '' : itemFormData.sellingPrice}
                                    onChange={(e) => setItemFormData({...itemFormData, sellingPrice: e.target.value})}
                                    className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-black focus:border-[#000000] font-bold transition-all text-sm"
                                    placeholder="0"
                                />
                             </div>
                         </div>
                         <div>
                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] block mb-2">MRP</label>
                             <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
                                <input 
                                    type="number"
                                    value={itemFormData.mrp === 0 ? '' : itemFormData.mrp}
                                    onChange={(e) => setItemFormData({...itemFormData, mrp: e.target.value})}
                                    className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-black focus:border-[#000000] font-bold transition-all text-sm"
                                    placeholder="0"
                                />
                             </div>
                         </div>
                         <div>
                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] block mb-2">Wholesale Price</label>
                             <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
                                <input 
                                    type="number"
                                    value={itemFormData.wholesalePrice === 0 ? '' : itemFormData.wholesalePrice}
                                    onChange={(e) => setItemFormData({...itemFormData, wholesalePrice: e.target.value})}
                                    className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-black focus:border-[#000000] font-bold transition-all text-sm"
                                    placeholder="0"
                                />
                             </div>
                         </div>
                    </div>
                </div>
                <div className="px-6 py-4 bg-gray-50 flex gap-3 justify-end border-t border-gray-100 shrink-0">
                    <button onClick={() => setShowItemModal(false)} className="px-4 py-2 font-bold text-[10px] uppercase tracking-widest text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
                    <button 
                      onClick={handleSaveItem}
                      className="px-8 py-2 bg-black text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-black/10 active:scale-95 transition-all"
                    >
                        {isEditingItem ? 'Update Item' : 'Save Item'}
                    </button>
                </div>
             </div>
        </div>
      )}
      
      {/* View Item Modal */}
      {showViewModal && viewedItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
             <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 my-auto flex flex-col max-h-[90vh]">
                <div className="px-6 py-5 flex justify-between items-center border-b border-gray-50 bg-gray-50/50 shrink-0 text-left">
                    <div>
                        <h3 className="text-lg font-black text-gray-900">{viewedItem.name}</h3>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">{viewedItem.code}</p>
                    </div>
                    <button onClick={() => setShowViewModal(false)} className="p-2 rounded-full hover:bg-gray-100 text-gray-400 border border-transparent hover:border-gray-200 transition-all"><X size={20} /></button>
                </div>
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1 text-left">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                        <div className="col-span-2 p-4 bg-indigo-50/50 rounded-xl border border-indigo-50">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Current Stock</p>
                                    <p className="text-2xl font-black text-indigo-600">{viewedItem.stock} <span className="text-sm text-gray-400 font-bold">{viewedItem.unit}</span></p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Category</p>
                                    <span className="px-3 py-1 bg-white rounded-lg text-xs font-bold text-gray-700 shadow-sm border border-gray-100">{viewedItem.category || 'Uncategorized'}</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Selling Price</p>
                            <p className="text-lg font-bold text-gray-900">₹{viewedItem.sellingPrice?.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Purchase Price</p>
                            <p className="text-lg font-bold text-gray-900">₹{viewedItem.purchasePrice?.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">MRP</p>
                            <p className="text-lg font-bold text-gray-500 line-through">₹{viewedItem.mrp?.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Wholesale</p>
                            <p className="text-lg font-bold text-gray-900">₹{viewedItem.wholesalePrice?.toLocaleString()}</p>
                        </div>

                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">GST Applied</p>
                            <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${viewedItem.gstRate && viewedItem.gstRate !== 'None' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-gray-100 text-gray-500'}`}>
                                {viewedItem.gstRate || 'None'}
                            </span>
                        </div>

                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">HSN Code</p>
                            <p className="text-sm font-bold text-gray-700">{viewedItem.hsn || 'N/A'}</p>
                        </div>
                        
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Godown Location</p>
                            <span className="px-3 py-1 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg text-xs font-bold text-purple-700 shadow-sm border border-purple-100 inline-block">
                                {(() => {
                                    if (!viewedItem.godown) return 'Primary';
                                    const matchedGodown = godowns.find(g => g._id === viewedItem.godown);
                                    return matchedGodown ? matchedGodown.name : (viewedItem.godown || 'Primary');
                                })()}
                            </span>
                        </div>
                        
                        <div>
                             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Value (Inc. Tax)</p>
                             <div className="flex flex-col">
                                <p className="text-lg font-bold text-emerald-600">
                                    ₹{(() => {
                                        const rateStr = viewedItem.gstRate || 'None';
                                        let rate = 0;
                                        if (rateStr !== 'None' && rateStr !== 'Exempted') {
                                            const matches = rateStr.match(/(\d+(\.\d+)?)%|@\s*(\d+(\.\d+)?)/g);
                                            if (matches) {
                                                rate = matches.reduce((acc, val) => {
                                                    const num = parseFloat(val.replace(/[^0-9.]/g, ''));
                                                    return acc + (isNaN(num) ? 0 : num);
                                                }, 0);
                                            }
                                        }
                                        const price = viewedItem.sellingPrice || 0;
                                        const taxAmount = price * (rate / 100);
                                        return (price + taxAmount).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
                                    })()}
                                </p>
                                <p className="text-[10px] font-bold text-gray-400">
                                    (+ ₹{(() => {
                                        const rateStr = viewedItem.gstRate || 'None';
                                        let rate = 0;
                                        if (rateStr !== 'None' && rateStr !== 'Exempted') {
                                            const matches = rateStr.match(/(\d+(\.\d+)?)%|@\s*(\d+(\.\d+)?)/g);
                                            if (matches) {
                                                rate = matches.reduce((acc, val) => {
                                                    const num = parseFloat(val.replace(/[^0-9.]/g, ''));
                                                    return acc + (isNaN(num) ? 0 : num);
                                                }, 0);
                                            }
                                        }
                                        const price = viewedItem.sellingPrice || 0;
                                        const taxAmount = price * (rate / 100);
                                        return taxAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
                                    })()} Tax)
                                </p>
                             </div>
                        </div>
                        
                        <div className="col-span-2 pt-4 border-t border-gray-50">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Description</p>
                            <p className="text-sm text-gray-600 font-medium leading-relaxed">
                                {viewedItem.description || 'No description available for this item.'}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="px-6 py-4 bg-gray-50 flex justify-end border-t border-gray-100">
                    <button 
                      onClick={() => setShowViewModal(false)}
                      className="px-6 py-2 bg-black text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-black/10 active:scale-95 transition-all"
                    >
                        Close Details
                    </button>
                </div>
             </div>
        </div>
      )}

      {/* Category Modal (Existing) */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 my-auto flex flex-col max-h-[90vh]">
                <div className="px-6 py-5 flex justify-between items-center border-b border-gray-50">
                    <h3 className="text-lg font-bold text-gray-900">Manage Categories</h3>
                    <button 
                        onClick={() => {
                            setShowCategoryModal(false);
                            setEditingCategory(null);
                            setCategoryName('');
                        }} 
                        className="p-1 rounded-full hover:bg-gray-100 text-gray-400"
                    >
                        <X size={20} />
                    </button>
                </div>
                
                {/* Category List */}
                <div className="p-6 max-h-[40vh] overflow-y-auto custom-scrollbar border-b border-gray-50">
                    <div className="space-y-2">
                        {categories.filter(c => c.name !== 'All Categories').map((cat) => (
                            <div key={cat.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl group hover:bg-indigo-50 transition-all border border-transparent hover:border-indigo-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-indigo-600 font-bold text-xs shadow-sm border border-gray-100">
                                        {cat.count}
                                    </div>
                                    <p className="font-bold text-gray-700 text-sm uppercase tracking-tight">{cat.name}</p>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => startEditCategory(cat)}
                                        className="p-2 text-gray-400 hover:text-black hover:bg-white rounded-lg transition-all"
                                        title={cat.id.toString().startsWith('adhoc-') ? "Claim this ad-hoc category" : "Edit category"}
                                    >
                                        <Pencil size={14} />
                                    </button>
                                    {!cat.id.toString().startsWith('adhoc-') && cat.id !== 'uncat' && (
                                        <button 
                                            onClick={() => handleDeleteCategory(cat)}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-white rounded-lg transition-all"
                                            title="Delete category"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Add/Edit Form */}
                <div className="p-6 bg-gray-50/50">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] block mb-2">
                        {editingCategory ? 'Update Category' : 'Add New Category'}
                    </label>
                    <div className="flex gap-2">
                        <input 
                          type="text" 
                          value={categoryName}
                          onChange={(e) => setCategoryName(e.target.value)}
                          className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-black focus:border-black font-bold transition-all text-sm"
                          placeholder="Ex: Pharma, Feed, etc."
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveCategory()}
                        />
                        <button 
                          onClick={handleSaveCategory}
                          className="px-6 py-3 bg-black text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-black/10 active:scale-95 transition-all"
                        >
                            {editingCategory ? 'Update' : 'Add'}
                        </button>
                        {editingCategory && (
                            <button 
                                onClick={() => {
                                    setEditingCategory(null);
                                    setCategoryName('');
                                }}
                                className="px-4 py-3 bg-white border border-gray-200 text-gray-500 rounded-xl font-bold text-[10px] uppercase tracking-widest"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Inventory;
