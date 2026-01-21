import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { 
  Plus, Search, Eye, Edit, 
  Trash2, ChevronRight, Users, TrendingUp, TrendingDown, 
  ArrowUpDown, FileText, Download, Filter, Phone, Tag, CreditCard, X
} from 'lucide-react';
import Swal from 'sweetalert2';
import Pagination from '../components/shared/Pagination';
import xlsx from 'json-as-xlsx';
import api from '../lib/axios';
import useUserPermissions from '../hooks/useUserPermissions';

const Parties = () => {
  const navigate = useNavigate();
  const { canCreate, canEdit, canDelete, canView } = useUserPermissions();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'collect', 'pay'
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [partiesList, setPartiesList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [categoryLoading, setCategoryLoading] = useState(false);

  const fetchParties = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/parties');
      setPartiesList(response.data);
    } catch (error) {
      console.error('Error fetching parties:', error);
      Swal.fire('Error', 'Failed to fetch parties', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/party-categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    setCategoryLoading(true);
    try {
        const response = await api.post('/party-categories', { name: newCategoryName.trim() });
        setCategories(prev => [...prev, response.data].sort((a, b) => a.name.localeCompare(b.name)));
        setNewCategoryName('');
        Swal.fire({
            title: 'Added',
            text: 'Category created successfully',
            icon: 'success',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 2000
        });
    } catch (error) {
        Swal.fire('Error', error.response?.data?.message || 'Failed to create category', 'error');
    } finally {
        setCategoryLoading(false);
    }
  };

  const handleUpdateCategory = async (id, name) => {
    if (!name.trim()) return;
    setCategoryLoading(true);
    try {
        const response = await api.put(`/party-categories/${id}`, { name: name.trim() });
        setCategories(prev => prev.map(cat => cat._id === id ? response.data : cat));
        setEditingCategoryId(null);
        setNewCategoryName('');
    } catch (error) {
        Swal.fire('Error', error.response?.data?.message || 'Failed to update category', 'error');
    } finally {
        setCategoryLoading(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    try {
        await api.delete(`/party-categories/${id}`);
        setCategories(prev => prev.filter(cat => cat._id !== id));
    } catch (error) {
        Swal.fire('Error', 'Failed to delete category', 'error');
    }
  };

  React.useEffect(() => {
    fetchParties();
    fetchCategories();
  }, []);

  const handleDelete = async (id) => {
    // Permission check
    if (!canDelete) {
        Swal.fire('Access Denied', 'You do not have permission to delete parties.', 'warning');
        return;
    }

    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/parties/${id}`);
        setPartiesList(prev => prev.filter(p => p._id !== id));
        Swal.fire('Deleted!', 'Party has been deleted.', 'success');
      } catch (error) {
        console.error('Error deleting party:', error);
        Swal.fire('Error', 'Failed to delete party', 'error');
      }
    }
  };

  const handleDownload = () => {
    const data = [
      {
        sheet: "Parties",
        columns: [
          { label: "Party Name", value: "name" },
          { label: "Category", value: "category" },
          { label: "Mobile", value: "mobile" },
          { label: "Type", value: "type" },
          { label: "Balance", value: "balance" },
          { label: "Balance Type", value: "balanceType" },
        ],
        content: partiesList.map(party => ({
          name: party.name,
          category: party.category,
          mobile: party.mobile,
          type: party.type,
          balance: party.balance,
          balanceType: (party.balanceType || '').toLowerCase().includes('collect') ? 'Receivable' : (party.balanceType || '').toLowerCase().includes('pay') ? 'Payable' : 'Neutral'
        })),
      },
    ];

    const settings = {
      fileName: "Parties_Directory_" + new Date().toISOString().split('T')[0],
      extraLength: 3,
      writeOptions: {},
    };

    xlsx(data, settings);
    
    Swal.fire({
      title: 'Success!',
      text: 'Excel file has been downloaded.',
      icon: 'success',
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000
    });
  };

  const filteredParties = partiesList.filter(party => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = (party.name || '').toLowerCase().includes(term) || 
                          (party.mobile || '').includes(term);
    
    const partyCat = (party.category || '').toLowerCase();
    const selectedCat = selectedCategory.toLowerCase();
    const matchesCategory = selectedCategory ? partyCat === selectedCat : true;
    
    let matchesType = true;
    const balanceType = (party.balanceType || '').toLowerCase();
    
    if (filterType === 'collect') {
      matchesType = balanceType.includes('collect');
    } else if (filterType === 'pay') {
      matchesType = balanceType.includes('pay');
    }

    return matchesSearch && matchesCategory && matchesType;
  });

  const totalPages = Math.ceil(filteredParties.length / itemsPerPage);
  const currentParties = filteredParties.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getBalanceColor = (type) => {
    const t = (type || '').toLowerCase(); // Normalize
    if (t === 'to collect' || t === 'collect') return 'text-green-600';
    if (t === 'to pay' || t === 'pay') return 'text-red-500';
    return 'text-gray-400';
  };

  return (
    <DashboardLayout>
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Party Directory</h1>
            <p className="text-sm text-gray-500 font-medium">Manage your customers and suppliers</p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
              <button 
                  onClick={() => navigate('/reports/party-list')}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-bold text-xs uppercase tracking-widest shadow-sm"
              >
                  <FileText size={16} className="text-black" />
                  Reports
              </button>
              {canCreate && (
                <button 
                    onClick={() => navigate('/add-party')}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-black text-white rounded-xl shadow-lg shadow-black/20 hover:bg-gray-800 transition-all font-bold text-xs uppercase tracking-widest"
                >
                    <Plus size={16} />
                    Add Party
                </button>
              )}
          </div>
      </div>

      {/* Stats Cards - Clickable for Filtering */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div 
            onClick={() => setFilterType('all')}
            className={`bg-white border p-4 rounded-2xl shadow-sm flex items-center gap-4 cursor-pointer transition-all ${filterType === 'all' ? 'border-indigo-600 ring-2 ring-indigo-600/10' : 'border-gray-100 hover:border-indigo-100'}`}
          >
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-black flex items-center justify-center shrink-0">
                  <Users size={20} />
              </div>
              <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Parties</p>
                  <p className="text-xl font-bold text-gray-900">{partiesList.length}</p>
              </div>
          </div>
          
          <div 
            onClick={() => setFilterType('collect')}
            className={`bg-white border p-4 rounded-2xl shadow-sm flex items-center gap-4 cursor-pointer transition-all ${filterType === 'collect' ? 'border-green-600 ring-2 ring-green-600/10' : 'border-gray-100 hover:border-green-100'}`}
          >
              <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                  <TrendingDown size={20} />
              </div>
              <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">To Collect</p>
                  <p className="text-xl font-bold text-green-600 italic">
                    ₹ {partiesList.reduce((acc, party) => {
                        const type = (party.balanceType || '').toLowerCase();
                        if (type.includes('collect')) return acc + (Number(party.openingBalance) || 0);
                        return acc;
                    }, 0).toLocaleString()}
                  </p>
              </div>
          </div>
          
          <div 
            onClick={() => setFilterType('pay')}
            className={`bg-white border p-4 rounded-2xl shadow-sm flex items-center gap-4 cursor-pointer transition-all ${filterType === 'pay' ? 'border-red-500 ring-2 ring-red-500/10' : 'border-gray-100 hover:border-red-100'}`}
          >
              <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                  <TrendingUp size={20} />
              </div>
              <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">To Pay</p>
                  <p className="text-xl font-bold text-red-500 italic">
                     ₹ {partiesList.reduce((acc, party) => {
                        const type = (party.balanceType || '').toLowerCase();
                        if (type.includes('pay')) return acc + (Number(party.openingBalance) || 0);
                        return acc;
                    }, 0).toLocaleString()}
                  </p>
              </div>
          </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Search party by name or phone..." 
                className="w-full pl-12 pr-4 h-12 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-black/10 focus:border-indigo-600 transition-all font-medium text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
          </div>
              <div className="flex gap-2">
                  <div className="relative flex items-center h-12">
                      <select 
                        className="appearance-none pl-4 pr-10 h-full bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-black/10 focus:border-indigo-600 transition-all font-bold text-xs uppercase tracking-widest text-gray-600"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                      >
                          <option value="">All Categories</option>
                          {categories.map(cat => (
                            <option key={cat._id} value={cat.name}>{cat.name}</option>
                          ))}
                      </select>
                      <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-gray-400 pointer-events-none" />
                  </div>
                  <button 
                    onClick={() => setShowCategoryModal(true)}
                    className="h-12 w-12 flex items-center justify-center bg-white border border-gray-200 rounded-xl text-gray-400 hover:text-black transition-colors shadow-sm"
                    title="Manage Categories"
                  >
                      <Tag size={20} />
                  </button>
                  <button 
                    onClick={handleDownload}
                    className="h-12 w-12 flex items-center justify-center bg-white border border-gray-200 rounded-xl text-gray-400 hover:text-black transition-colors shadow-sm"
                    title="Export to Excel"
                  >
                      <Download size={20} />
                  </button>
              </div>
      </div>

      {/* Desktop View Table */}
      <div className="hidden sm:block bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
              <thead>
                  <tr className="bg-gray-50/50">
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50 italic">Party Details</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50 italic">Category</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50 italic">Type</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50 italic text-right">Balance</th>
                      <th className="px-6 py-4 text-right border-b border-gray-50"></th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                  {currentParties.map((party) => (
                      <tr key={party._id} className="group hover:bg-indigo-50/20 transition-all duration-200">
                          <td className="px-6 py-4">
                              <p className="font-bold text-gray-900 text-sm group-hover:text-black transition-colors">{party.name}</p>
                              <p className="text-[10px] text-gray-400 font-bold">{party.mobile}</p>
                          </td>
                          <td className="px-6 py-4">
                              <span className="px-2 py-1 bg-gray-50 text-gray-500 rounded-lg text-[9px] font-black uppercase tracking-widest border border-gray-100">{party.category || '-'}</span>
                          </td>
                          <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${party.type === 'Supplier' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                  {party.type}
                              </span>
                          </td>
                          <td className={`px-6 py-4 text-right font-bold text-sm tabular-nums italic ${getBalanceColor(party.balanceType)}`}>
                              ₹ {party.openingBalance ? party.openingBalance.toLocaleString() : '0'}
                          </td>
                          <td className="px-6 py-4">
                              <div className="flex items-center justify-end gap-1 opacity-100 transition-opacity">
                                  {canView && (
                                    <button onClick={() => navigate(`/view-party/${party._id}`)} className="p-1.5 text-gray-400 hover:text-black transition-colors" title="View Details"><Eye size={16} /></button>
                                  )}
                                  {canEdit && (
                                    <button onClick={() => navigate(`/edit-party/${party._id}`)} className="p-1.5 text-gray-400 hover:text-black transition-colors" title="Edit Party"><Edit size={16} /></button>
                                  )}
                                  {canDelete && (
                                    <button onClick={() => handleDelete(party._id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors" title="Delete Party"><Trash2 size={16} /></button>
                                  )}
                              </div>
                          </td>
                      </tr>
                  ))}
              </tbody>
          </table>
          <div className="p-4 border-t border-gray-50">
               <Pagination 
                currentPage={currentPage}
                totalPages={totalPages}
                itemsPerPage={itemsPerPage}
                totalItems={filteredParties.length}
                onPageChange={setCurrentPage}
            />
          </div>
      </div>

      {/* Mobile View Cards */}
      <div className="sm:hidden space-y-3">
          {currentParties.map((party) => (
              <div key={party._id} className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm active:scale-[0.98] transition-all">
                  <div className="flex justify-between items-start mb-3">
                      <div className="flex-1 min-w-0 mr-4">
                          <h3 className="font-bold text-gray-900 truncate">{party.name}</h3>
                          <div className="flex items-center gap-1.5 text-gray-400 mt-0.5">
                              <Phone size={10} />
                              <span className="text-[10px] font-bold tracking-tight">{party.mobile}</span>
                          </div>
                      </div>
                      <span className={`shrink-0 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border ${party.type === 'Supplier' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                          {party.type}
                      </span>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-4">
                      <div className="flex items-center gap-1 px-2 py-0.5 bg-gray-50 rounded text-[9px] font-bold text-gray-500">
                          <Tag size={10} />
                          {party.category || '-'}
                      </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                      <div>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Balance Due</p>
                          <p className={`font-bold italic text-sm ${getBalanceColor(party.balanceType)}`}>₹ {party.openingBalance ? party.openingBalance.toLocaleString() : '0'}</p>
                      </div>
                      <div className="flex items-center gap-1">
                          {canView && (
                              <button onClick={() => navigate(`/view-party/${party._id}`)} className="p-2 text-gray-400 bg-gray-50 rounded-xl active:bg-indigo-50 active:text-black"><Eye size={18} /></button>
                          )}
                          {canEdit && (
                              <button onClick={() => navigate(`/edit-party/${party._id}`)} className="p-2 text-gray-400 bg-gray-50 rounded-xl active:bg-indigo-50 active:text-black"><Edit size={18} /></button>
                          )}
                          {canDelete && (
                              <button onClick={() => handleDelete(party._id)} className="p-2 text-gray-400 bg-gray-50 rounded-xl active:bg-red-50 active:text-red-500"><Trash2 size={18} /></button>
                          )}
                      </div>
                  </div>
              </div>
          ))}

          {/* Mobile Pagination */}
          <div className="pt-4 pb-8 flex justify-center">
             <Pagination 
                currentPage={currentPage}
                totalPages={totalPages}
                itemsPerPage={itemsPerPage}
                totalItems={filteredParties.length}
                onPageChange={setCurrentPage}
            />
          </div>
      </div>
      {/* Category Management Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 tracking-tight">
                <Tag size={20} className="text-indigo-600" />
                Manage Categories
              </h3>
              <button 
                onClick={() => {
                    setShowCategoryModal(false);
                    setEditingCategoryId(null);
                    setNewCategoryName('');
                }}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
                <form 
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (editingCategoryId) handleUpdateCategory(editingCategoryId, newCategoryName);
                        else handleCreateCategory(e);
                    }} 
                    className="mb-6"
                >
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            required
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black/10 outline-none text-sm font-medium"
                            placeholder="Enter category name..."
                        />
                        <button 
                            type="submit"
                            disabled={categoryLoading}
                            className={`px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${editingCategoryId ? 'bg-green-600 hover:bg-green-700' : 'bg-black hover:bg-gray-800'} text-white shadow-sm`}
                        >
                            {categoryLoading ? '...' : editingCategoryId ? 'Update' : 'Add'}
                        </button>
                    </div>
                </form>

                <div className="max-h-[300px] overflow-auto space-y-2">
                    {categories.length === 0 ? (
                        <p className="text-center text-gray-400 py-8 text-sm italic">No categories added yet.</p>
                    ) : (
                        categories.map(cat => (
                            <div key={cat._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl group hover:bg-gray-100 transition-all border border-transparent hover:border-gray-200">
                                <span className="text-sm font-bold text-gray-700">{cat.name}</span>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => {
                                            setEditingCategoryId(cat._id);
                                            setNewCategoryName(cat.name);
                                        }}
                                        className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                                    >
                                        <Edit size={14} />
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteCategory(cat._id)}
                                        className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Parties;