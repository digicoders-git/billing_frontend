import React, { useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { 
    Search, Plus, MapPin, 
    MoreVertical, Settings, ExternalLink, 
    Box, TrendingUp, ChevronDown, RefreshCw, Pencil, Trash2, X,
    Database, MapPinned, CreditCard, ChevronRight, LayoutGrid
} from 'lucide-react';
import Pagination from '../components/shared/Pagination';
import Swal from 'sweetalert2';
import api from '../lib/axios';

const Godown = () => {
  const [selectedGodownId, setSelectedGodownId] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const itemsPerPage = 6;
  
  // Modal & Form State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
      id: '',
      name: '',
      address: '',
      state: '',
      pincode: '',
      city: '',
      type: 'Secondary'
  });

  const [godowns, setGodowns] = useState([]);
  const [allGodownItems, setAllGodownItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchGodowns = async () => {
      try {
          const response = await api.get('/godowns');
          setGodowns(response.data.map(g => ({ ...g, id: g._id })));
          if (response.data.length > 0 && !selectedGodownId) {
              setSelectedGodownId(response.data[0]._id);
          }
      } catch (error) {
          console.error("Error fetching godowns", error);
      }
  };

  const fetchItems = async () => {
      try {
          const response = await api.get('/items');
          setAllGodownItems(response.data.map(item => {
              const stock = Number(item.stock) || 0;
              const purchasePrice = Number(item.purchasePrice) || 0;
              return {
                  id: item._id,
                  name: item.name,
                  code: item.code || 'N/A',
                  batch: 'STD', // Standard batch default
                  stock: stock,
                  unit: item.unit || 'PCS',
                  value: stock * purchasePrice, // Use Cost for Valuation
                  selling: item.sellingPrice,
                  purchase: purchasePrice
              };
          }));
      } catch (error) {
           console.error("Error fetching items", error);
      }
  };

  React.useEffect(() => {
      setLoading(true);
      Promise.all([fetchGodowns(), fetchItems()]).finally(() => setLoading(false));
  }, []);

  const selectedGodown = godowns.find(g => g.id === selectedGodownId) || (godowns.length > 0 ? godowns[0] : {});
  const totalPages = Math.ceil(allGodownItems.length / itemsPerPage);
  const currentItems = allGodownItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Dynamic Godown Stats
  const activeStockValue = allGodownItems.reduce((acc, item) => acc + item.value, 0); 
  const totalStockQuantity = allGodownItems.reduce((acc, item) => acc + item.stock, 0);

  const handleSave = async () => {
      if (!formData.name) return;
      
      try {
          const { id, ...payload } = formData;
          
          let response;
          if (isEditing) {
               // Update existing
               response = await api.put(`/godowns/${formData.id}`, payload);
               setGodowns(prev => prev.map(g => g.id === formData.id ? { ...response.data, id: response.data._id } : g));
               Swal.fire('Updated!', 'Godown details updated successfully.', 'success');
          } else {
               // Create new
               response = await api.post('/godowns', payload);
               setGodowns(prev => [...prev, { ...response.data, id: response.data._id }]);
               Swal.fire('Created!', 'New godown has been registered.', 'success');
          }
          setShowModal(false);
          setFormData({ id: '', name: '', address: '', state: '', pincode: '', city: '', type: 'Secondary' });
      } catch (error) {
          console.error('Error saving godown:', error);
          Swal.fire('Error', error.response?.data?.message || 'Failed to save godown details', 'error');
      }
  };

  const handleDeleteGodown = async (id) => {
    if (godowns.length <= 1) {
        Swal.fire({
            title: 'Action Denied',
            text: 'System requires at least one active godown location.',
            icon: 'error',
            confirmButtonColor: '#6366f1'
        });
        return;
    }

    const result = await Swal.fire({
        title: 'Delete Godown?',
        text: "This will remove the location record. Stock records should be transferred before deletion.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#000000',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
        try {
            await api.delete(`/godowns/${id}`);
            const remaining = godowns.filter(g => g.id !== id);
            setGodowns(remaining);
            
            // If deleted godown was selected, switch to another one
            if (selectedGodownId === id) {
                setSelectedGodownId(remaining[0].id);
            }

            Swal.fire({
                title: 'Removed!',
                text: 'Godown has been deleted successfully.',
                icon: 'success',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000
            });
        } catch (error) {
            console.error('Error deleting godown:', error);
            Swal.fire('Error', 'Failed to delete godown', 'error');
        }
    }
  };

  const handleRefresh = async () => {
      setIsRefreshing(true);
      await Promise.all([fetchGodowns(), fetchItems()]);
      setIsRefreshing(false);
      Swal.fire({
          title: 'Refreshed!',
          text: 'Stock data has been updated.',
          icon: 'success',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 2000
      });
  };

  return (
    <DashboardLayout>
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight uppercase">Godown Management</h1>
            <p className="text-xs sm:text-sm text-gray-500 font-bold">Coordinate stock across multiple locations</p>
          </div>
          <button 
              onClick={() => { 
                  setIsEditing(false); 
                  setFormData({ id: '', name: '', address: '', state: '', pincode: '', city: '', type: 'Secondary' });
                  setShowModal(true); 
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-[#000000] text-white rounded-xl shadow-lg shadow-indigo-600/20 hover:bg-[#b4933d] transition-all font-black text-[10px] uppercase tracking-widest"
          >
              <Plus size={16} />
              New Godown
          </button>
      </div>

      {/* Refined Stats & Selector Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          
          {/* Active Godown Selector */}
          <div className="bg-white border border-gray-100 p-4 rounded-[24px] shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow group">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Godown</span>
                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                            onClick={() => { setIsEditing(true); setFormData(selectedGodown); setShowModal(true); }} 
                            className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-50 rounded-lg transition-all"
                        >
                            <Pencil size={12} />
                        </button>
                        <button 
                            onClick={() => handleDeleteGodown(selectedGodown.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        >
                            <Trash2 size={12} />
                        </button>
                    </div>
                </div>
                <div className="relative">
                    <select 
                        value={selectedGodownId}
                        onChange={(e) => setSelectedGodownId(e.target.value)}
                        className="w-full pl-0 pr-8 py-1 bg-transparent border-none appearance-none text-gray-900 font-black focus:outline-none cursor-pointer text-sm truncate"
                    >
                        {godowns.map(g => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
                <div className="mt-2 flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-[8px] font-black rounded-md border uppercase tracking-widest ${selectedGodown.type === 'Primary' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                        {selectedGodown.type || 'Secondary'}
                    </span>
                    <span className="text-[10px] text-gray-400 font-bold truncate">● {selectedGodown.city || 'N/A'}</span>
                </div>
          </div>

          {/* Location Details Quick View */}
          <div className="bg-white border border-gray-100 p-4 rounded-[24px] shadow-sm flex items-center gap-4 group hover:border-indigo-100 transition-all">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0 shadow-inner">
                  <MapPinned size={18} />
              </div>
              <div className="flex flex-col overflow-hidden">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Godown Location</span>
                  <p className="text-[11px] font-bold text-gray-600 leading-tight line-clamp-2 italic">{selectedGodown.address || 'No address provided'}</p>
              </div>
          </div>

          {/* Stock Valuation Card - Premium Dark */}
          <div className="bg-[#000000] rounded-[24px] p-4 relative overflow-hidden shadow-xl shadow-gray-200 group">
                <div className="relative z-10 flex flex-col justify-between h-full">
                    <div className="flex items-center gap-2 opacity-60 mb-1">
                        <Database size={12} className="text-white" />
                        <span className="text-[9px] font-black text-white uppercase tracking-widest">Active Stock Value</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-white text-xl font-black italic tabular-nums">₹{activeStockValue.toLocaleString()}</span>
                        <TrendingUp size={12} className="text-green-400" />
                    </div>
                    <div className="mt-2 flex items-center gap-1.5 overflow-hidden">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shrink-0"></div>
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter truncate">Live Inventory Sync Active</span>
                    </div>
                </div>
                <Database size={60} className="absolute -bottom-4 -right-2 text-white/10 -rotate-12 group-hover:scale-110 transition-transform duration-500" />
          </div>

          {/* Total Stock Volume Card */}
          <div className="bg-white border border-gray-100 p-4 rounded-[24px] shadow-sm flex flex-col justify-between group hover:shadow-md transition-all">
                <div className="flex justify-between items-center mb-2">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                        <Box size={16} />
                    </div>
                    <div className="text-right">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Total Quantity</span>
                        <span className="text-sm font-black text-blue-600 italic">{totalStockQuantity.toLocaleString()} <span className="text-[9px] text-gray-400 font-bold not-italic">UNITS</span></span>
                    </div>
                </div>
                <div className="space-y-1.5">
                    <div className="flex justify-between text-[8px] font-black text-gray-400 uppercase">
                        <span>Utilization</span>
                        <span>Across {allGodownItems.length} Products</span>
                    </div>
                     <div className="w-full h-1.5 bg-gray-50 rounded-full overflow-hidden border border-gray-100/50">
                        <div className="h-full bg-blue-600 rounded-full w-full opacity-20"></div>
                    </div>
                </div>
          </div>
      </div>

      {/* Item List Seciton */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
              <div>
                  <h2 className="text-sm font-bold text-gray-900 uppercase tracking-tight">Stock Stream</h2>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Active Inventory in {(selectedGodown?.name || '').split(' ')[0]}</p>
              </div>
              <button 
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2 bg-white border border-gray-200 rounded-xl text-gray-400 hover:text-indigo-600 shadow-sm transition-all disabled:opacity-50"
              >
                  <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
              </button>
          </div>

          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left">
                  <thead>
                      <tr className="bg-gray-50/20">
                          <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50 italic">Product</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50 italic">Batch</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50 italic text-right">Quantity</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50 italic text-right">Valuation</th>
                          <th className="px-6 py-4 w-10 border-b border-gray-50"></th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                      {currentItems.map((item) => (
                          <tr key={item.id} className="group hover:bg-indigo-50/20 transition-all">
                              <td className="px-6 py-4">
                                  <p className="font-bold text-gray-900 text-sm">{item.name}</p>
                                  <p className="text-[10px] text-gray-400 font-bold tracking-tight uppercase">SKU: {item.code}</p>
                              </td>
                              <td className="px-6 py-4">
                                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[9px] font-black uppercase tracking-widest">{item.batch}</span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${item.stock > 10 ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-500 border-red-100'}`}>
                                      {item.stock} {item.unit}
                                  </span>
                              </td>
                              <td className="px-6 py-4 text-right font-bold text-sm text-gray-900 italic tabular-nums">₹{item.value.toLocaleString()}</td>
                              <td className="px-6 py-4">
                                  <button className="p-1 text-gray-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-all"><MoreVertical size={16} /></button>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>

          {/* Mobile Card Layout */}
          <div className="lg:hidden divide-y divide-gray-50">
              {currentItems.map((item) => (
                  <div key={item.id} className="p-4 active:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                          <div className="flex-1 min-w-0 mr-4">
                              <h3 className="font-bold text-gray-900 text-sm truncate">{item.name}</h3>
                              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">SKU: {item.code}</p>
                          </div>
                           <span className={`shrink-0 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border ${item.stock > 10 ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-500 border-red-100'}`}>
                              {item.stock} {item.unit}
                          </span>
                      </div>
                      <div className="flex justify-between items-center text-[10px]">
                          <div className="flex items-center gap-1.5">
                              <span className="text-gray-400 font-bold">BATCH:</span>
                              <span className="text-indigo-600 font-black tracking-widest">{item.batch}</span>
                          </div>
                          <div className="text-right">
                              <span className="text-gray-400 font-bold uppercase mr-2">VALUATION:</span>
                              <span className="text-gray-900 font-bold italic">₹{item.value.toLocaleString()}</span>
                          </div>
                      </div>
                  </div>
              ))}
          </div>

          <div className="p-4 border-t border-gray-50 bg-gray-50/30">
              <Pagination 
                  currentPage={currentPage}
                  totalPages={totalPages}
                  itemsPerPage={itemsPerPage}
                  totalItems={allGodownItems.length}
                  onPageChange={setCurrentPage}
              />
          </div>
      </div>

      {/* Godown Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-6 py-5 flex justify-between items-center border-b border-gray-50">
                    <h3 className="text-lg font-bold text-gray-900">{isEditing ? 'Edit Warehouse' : 'New Warehouse'}</h3>
                    <button onClick={() => setShowModal(false)} className="p-1 rounded-full hover:bg-gray-100 text-gray-400"><X size={20} /></button>
                </div>
                
                <div className="p-6 space-y-6">
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] block mb-2">Godown Identity</label>
                        <input 
                            type="text" 
                            placeholder="Ex: Main Branch Storage"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-black focus:border-[#000000] font-bold transition-all text-sm"
                        />
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] block mb-2">Location Details</label>
                        <textarea 
                            rows={3}
                            placeholder="Street address, landmarks..."
                            value={formData.address}
                            onChange={(e) => setFormData({...formData, address: e.target.value})}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-black focus:border-[#000000] font-bold transition-all text-sm resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] block mb-2">City</label>
                            <input 
                                type="text"
                                value={formData.city} 
                                onChange={(e) => setFormData({...formData, city: e.target.value})}
                                placeholder="City" 
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-black focus:border-[#000000] font-bold transition-all text-sm" 
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] block mb-2">Pincode</label>
                            <input 
                                type="text"
                                value={formData.pincode}
                                onChange={(e) => setFormData({...formData, pincode: e.target.value})}
                                placeholder="Zip" 
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-black focus:border-[#000000] font-bold transition-all text-sm" 
                            />
                        </div>
                         <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] block mb-2">Role/Type</label>
                            <select 
                                value={formData.type}
                                onChange={(e) => setFormData({...formData, type: e.target.value})}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-black focus:border-[#000000] font-bold transition-all text-sm"
                            >
                                <option>Primary</option>
                                <option>Secondary</option>
                                <option>Distribution</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="px-6 py-4 bg-gray-50 flex gap-3 justify-end border-t border-gray-100">
                    <button onClick={() => setShowModal(false)} className="px-4 py-2 font-bold text-[10px] uppercase tracking-widest text-gray-500">Discard</button>
                    <button 
                      onClick={handleSave}
                      className="px-8 py-2 bg-black text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-black/10 active:scale-95 transition-all"
                    >
                        {isEditing ? 'Update Godown' : 'Save Godown'}
                    </button>
                </div>
            </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Godown;
