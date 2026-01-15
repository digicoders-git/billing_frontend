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

import useUserPermissions from '../hooks/useUserPermissions';

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
      description: ''
  });
  
  // State for Viewing Item
  const [viewedItem, setViewedItem] = useState(null);

  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const response = await api.get('/items');
      setItems(response.data);
      
      // Extract unique categories and counts
      const cats = {};
      response.data.forEach(item => {
        const cat = item.category || 'Uncategorized';
        cats[cat] = (cats[cat] || 0) + 1;
      });
      
      setCategories(Object.entries(cats).map(([name, count], index) => ({
        id: index,
        name,
        count
      })));

    } catch (error) {
      console.error('Error fetching items:', error);
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

  const handleSaveCategory = () => {
    setShowCategoryModal(false);
    setCategoryName('');
  };

  // --- Item Management Functions ---

  const handleAddItem = () => {
      setIsEditingItem(false);
      setItemFormData({
        name: '', code: '', category: '', unit: 'PCS',
        stock: 0, minStock: 5, purchasePrice: 0,
        sellingPrice: 0, mrp: 0, wholesalePrice: 0, description: ''
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

  const handleSaveItem = async () => {
      if (!itemFormData.name) {
          Swal.fire('Error', 'Item Name is required', 'error');
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
          <div className="bg-[#000000] border border-gray-100 p-5 rounded-2xl shadow-sm flex items-center justify-between group hover:border-indigo-100 transition-all cursor-pointer">
              <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <TrendingUp size={20} />
                  </div>
                  <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Stock Valuation</p>
                      <p className="text-xl font-bold text-white italic">₹ {stockValuation.toLocaleString()}</p>
                  </div>
              </div>
              <ExternalLink size={16} className="text-gray-300 group-hover:text-indigo-600 transition-colors" />
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
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50 italic">Item Details</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50 italic">Storage Unit</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50 italic text-right">Selling Price</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50 italic text-right">Purchase</th>
                      <th className="px-6 py-4 text-right border-b border-gray-50"></th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                  {currentItems.map((item) => (
                      <tr key={item._id} className="group hover:bg-indigo-50/20 transition-all">
                          <td className="px-6 py-4">
                              <p className="font-bold text-gray-900 text-sm">{item.name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[10px] text-gray-400 font-bold tracking-tight uppercase">Code: {item.code}</span>
                                  <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                  <span className="text-[10px] text-indigo-500 font-black tracking-tight uppercase">{item.category}</span>
                              </div>
                          </td>
                          <td className="px-6 py-4">
                              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${item.stock > (item.minStock || 5) ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-500 border-red-100'}`}>
                                  {item.stock} {item.unit}
                              </span>
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-sm text-gray-900 italic tabular-nums">₹{item.sellingPrice ? item.sellingPrice.toLocaleString() : 0}</td>
                          <td className="px-6 py-4 text-right font-bold text-sm text-gray-400 italic tabular-nums">₹{item.purchasePrice ? item.purchasePrice.toLocaleString() : 0}</td>
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
                          <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">#{item.code}</span>
                              <span className="text-[10px] text-indigo-500 font-black uppercase tracking-widest">{item.category}</span>
                          </div>
                      </div>
                      <span className={`shrink-0 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${item.stock > (item.minStock || 5) ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-500 border-red-100'}`}>
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
             <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-6 py-5 flex justify-between items-center border-b border-gray-50">
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
                         
                         {/* Category & Unit */}
                         <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] block mb-2">Category</label>
                            <input 
                                list="categories"
                                type="text"
                                value={itemFormData.category}
                                onChange={(e) => setItemFormData({...itemFormData, category: e.target.value})}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-black focus:border-[#000000] font-bold transition-all text-sm"
                                placeholder="Select or type category"
                            />
                            <datalist id="categories">
                                {categories.map(c => <option key={c.id} value={c.name} />)}
                            </datalist>
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
                                value={itemFormData.stock}
                                onChange={(e) => setItemFormData({...itemFormData, stock: e.target.value})}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-black focus:border-[#000000] font-bold transition-all text-sm"
                             />
                         </div>
                         <div>
                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] block mb-2">Low Stock Alert Level</label>
                             <input 
                                type="number"
                                value={itemFormData.minStock}
                                onChange={(e) => setItemFormData({...itemFormData, minStock: e.target.value})}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-black focus:border-[#000000] font-bold transition-all text-sm"
                             />
                         </div>

                         {/* Pricing */}
                         <div>
                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] block mb-2">Purchase Price (Cost)</label>
                             <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
                                <input 
                                    type="number"
                                    value={itemFormData.purchasePrice}
                                    onChange={(e) => setItemFormData({...itemFormData, purchasePrice: e.target.value})}
                                    className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-black focus:border-[#000000] font-bold transition-all text-sm"
                                />
                             </div>
                         </div>
                         <div>
                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] block mb-2">Selling Price</label>
                             <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
                                <input 
                                    type="number"
                                    value={itemFormData.sellingPrice}
                                    onChange={(e) => setItemFormData({...itemFormData, sellingPrice: e.target.value})}
                                    className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-black focus:border-[#000000] font-bold transition-all text-sm"
                                />
                             </div>
                         </div>
                         <div>
                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] block mb-2">MRP</label>
                             <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
                                <input 
                                    type="number"
                                    value={itemFormData.mrp}
                                    onChange={(e) => setItemFormData({...itemFormData, mrp: e.target.value})}
                                    className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-black focus:border-[#000000] font-bold transition-all text-sm"
                                />
                             </div>
                         </div>
                         <div>
                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] block mb-2">Wholesale Price</label>
                             <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
                                <input 
                                    type="number"
                                    value={itemFormData.wholesalePrice}
                                    onChange={(e) => setItemFormData({...itemFormData, wholesalePrice: e.target.value})}
                                    className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-black focus:border-[#000000] font-bold transition-all text-sm"
                                />
                             </div>
                         </div>
                    </div>
                </div>
                <div className="px-6 py-4 bg-gray-50 flex gap-3 justify-end border-t border-gray-100">
                    <button onClick={() => setShowItemModal(false)} className="px-4 py-2 font-bold text-[10px] uppercase tracking-widest text-gray-500">Cancel</button>
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
             <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-6 py-5 flex justify-between items-center border-b border-gray-50 bg-gray-50/50">
                    <div>
                        <h3 className="text-lg font-black text-gray-900">{viewedItem.name}</h3>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">{viewedItem.code}</p>
                    </div>
                    <button onClick={() => setShowViewModal(false)} className="p-2 rounded-full hover:bg-gray-100 text-gray-400 border border-transparent hover:border-gray-200 transition-all"><X size={20} /></button>
                </div>
                <div className="p-6">
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-6 py-5 flex justify-between items-center border-b border-gray-50">
                    <h3 className="text-lg font-bold text-gray-900">{editingCategory ? 'Edit Category' : 'New Category'}</h3>
                    <button onClick={() => setShowCategoryModal(false)} className="p-1 rounded-full hover:bg-gray-100 text-gray-400"><X size={20} /></button>
                </div>
                <div className="p-6">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] block mb-2">Category Name</label>
                    <input 
                      type="text" 
                      value={categoryName}
                      onChange={(e) => setCategoryName(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600 font-bold transition-all text-sm"
                      placeholder="Ex: Pharma, Feed, etc."
                      autoFocus
                    />
                </div>
                <div className="px-6 py-4 bg-gray-50 flex gap-3 justify-end border-t border-gray-100">
                    <button onClick={() => setShowCategoryModal(false)} className="px-4 py-2 font-bold text-[10px] uppercase tracking-widest text-gray-500">Cancel</button>
                    <button 
                      onClick={handleSaveCategory}
                      className="px-8 py-2 bg-black text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-black/10 active:scale-95 transition-all"
                    >
                        Save Category
                    </button>
                </div>
            </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Inventory;
