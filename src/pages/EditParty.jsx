import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { ArrowLeft, User, Phone, Building, CreditCard, MapPin, Mail, Save, FileText, ChevronDown, Plus, X, Tag, Edit, Trash2, Check } from 'lucide-react';
import api from '../lib/axios';
import Swal from 'sweetalert2';

const EditParty = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    type: 'Customer',
    mobile: '',
    email: '',
    gstin: '',
    pan: '',
    companyName: '',
    category: '',
    billingAddress: '',
    placeOfSupply: '',
    openingBalance: 0,
    creditLimit: 0,
    balanceType: 'To Collect'
  });
  const [categories, setCategories] = useState([]);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [categoryLoading, setCategoryLoading] = useState(false);

  // Fetch data
  useEffect(() => {
    const fetchParty = async () => {
      try {
        const response = await api.get(`/parties/${id}`);
        // Map backend data to form state
        // Ensure fields exist to avoid uncontrolled input warnings
        const data = response.data;
        setFormData({
            name: data.name || '',
            type: data.type || 'Customer',
            mobile: data.mobile || '',
            email: data.email || '',
            gstin: data.gstin || '',
            pan: data.pan || '',
            companyName: data.companyName || '',
            category: data.category || '',
            billingAddress: data.billingAddress || data.address || '',
            placeOfSupply: data.placeOfSupply || '',
            openingBalance: data.openingBalance || data.balance || 0,
            creditLimit: data.creditLimit || 0,
            balanceType: data.balanceType || 'To Collect'
        });
      } catch (error) {
        console.error('Error fetching party details:', error);
        Swal.fire('Error', 'Failed to fetch party details', 'error');
        navigate('/parties');
      } finally {
        setLoading(false);
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

    if (id) {
        fetchParty();
        fetchCategories();
    }
  }, [id, navigate]);

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    
    setCategoryLoading(true);
    try {
        const response = await api.post('/party-categories', { name: newCategoryName.trim() });
        setCategories(prev => [...prev, response.data].sort((a, b) => a.name.localeCompare(b.name)));
        setFormData(prev => ({ ...prev, category: response.data.name }));
        setNewCategoryName('');
        setShowAddCategory(false);
        Swal.fire({
            title: 'Success',
            text: 'Category added successfully',
            icon: 'success',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 2000
        });
    } catch (error) {
        console.error('Error creating category:', error);
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
        Swal.fire({
            title: 'Updated',
            text: 'Category updated successfully',
            icon: 'success',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 2000
        });
    } catch (error) {
        console.error('Error updating category:', error);
        Swal.fire('Error', error.response?.data?.message || 'Failed to update category', 'error');
    } finally {
        setCategoryLoading(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    const result = await Swal.fire({
        title: 'Are you sure?',
        text: "Categories assigned to parties won't be cleared, but this category will be removed from the list.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
        setCategoryLoading(true);
        try {
            await api.delete(`/party-categories/${id}`);
            setCategories(prev => prev.filter(cat => cat._id !== id));
            Swal.fire('Deleted!', 'Category has been removed.', 'success');
        } catch (error) {
            console.error('Error deleting category:', error);
            Swal.fire('Error', 'Failed to delete category', 'error');
        } finally {
            setCategoryLoading(false);
        }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        await api.put(`/parties/${id}`, formData);
        Swal.fire({
            title: 'Success!',
            text: 'Party updated successfully.',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
        });
        navigate('/parties');
    } catch (error) {
        console.error('Error updating party:', error);
        Swal.fire('Error', 'Failed to update party. Please try again.', 'error');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-4 mb-6 sm:mb-8">
        <button
          onClick={() => navigate('/parties')}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all shrink-0"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">Edit Party</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">Update party information</p>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden w-full">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900">Party Information</h3>
          <p className="text-sm text-gray-600 mt-1">Update the details below to modify party information</p>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6">
          <div className="space-y-6 sm:space-y-8">
            {/* Basic Information Section */}
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User size={18} className="text-blue-600 shrink-0" />
                <span className="truncate">Basic Information</span>
              </h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Party Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                    placeholder="Enter party name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Party Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base appearance-none bg-white"
                  >
                    <option value="Customer">Customer</option>
                    <option value="Supplier">Supplier</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                        <select
                            value={formData.category}
                            onChange={(e) => setFormData({...formData, category: e.target.value})}
                            className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base appearance-none bg-white pr-10"
                        >
                            <option value="">Select Category</option>
                            {categories.map(cat => (
                                <option key={cat._id} value={cat.name}>{cat.name}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                    </div>
                    <button 
                        type="button"
                        onClick={() => setShowAddCategory(true)}
                        className="p-2 sm:p-3 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-all flex items-center justify-center shrink-0"
                        title="Add New Category"
                    >
                        <Plus size={20} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information Section */}
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Phone size={18} className="text-green-600 shrink-0" />
                <span className="truncate">Contact Information</span>
              </h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    value={formData.mobile}
                    onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                    placeholder="+91 9876543210"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                    placeholder="party@example.com"
                  />
                </div>
              </div>
            </div>

            {/* Business Information Section */}
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Building size={18} className="text-purple-600 shrink-0" />
                <span className="truncate">Business Information</span>
              </h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                    placeholder="Enter company name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    GSTIN
                  </label>
                  <input
                    type="text"
                    value={formData.gstin}
                    onChange={(e) => setFormData({...formData, gstin: e.target.value})}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                    placeholder="27AABCU9603R1ZX"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    PAN Number
                  </label>
                  <input
                    type="text"
                    value={formData.pan}
                    onChange={(e) => setFormData({...formData, pan: e.target.value.toUpperCase()})}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                    placeholder="ABCDE1234F"
                  />
                </div>

                 <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Credit Limit
                  </label>
                  <input
                    type="number"
                    value={formData.creditLimit}
                    onChange={(e) => setFormData({...formData, creditLimit: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Opening Balance
                  </label>
                  <div className="flex gap-2 sm:gap-3">
                    <input
                      type="number"
                      value={formData.openingBalance}
                      onChange={(e) => setFormData({...formData, openingBalance: parseFloat(e.target.value) || 0})}
                      className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                      placeholder="0"
                    />
                    <select
                      value={formData.balanceType}
                      onChange={(e) => setFormData({...formData, balanceType: e.target.value})}
                      className="px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base appearance-none bg-white"
                    >
                      <option value="To Collect">To Collect</option>
                      <option value="To Pay">To Pay</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Address Information Section */}
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin size={18} className="text-red-600 shrink-0" />
                <span className="truncate">Address Information</span>
              </h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Billing Address
                  </label>
                  <textarea
                    value={formData.billingAddress}
                    onChange={(e) => setFormData({...formData, billingAddress: e.target.value})}
                    rows={3}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                    placeholder="Enter billing address with city, state, and pincode"
                  />
                </div>

                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">
                    Place of Supply (State)
                  </label>
                  <div className="relative">
                    <select
                      value={formData.placeOfSupply}
                      onChange={(e) => setFormData({...formData, placeOfSupply: e.target.value})}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base appearance-none bg-white"
                    >
                        <option value="">Select State</option>
                        <option value="Andhra Pradesh">Andhra Pradesh</option>
                        <option value="Arunachal Pradesh">Arunachal Pradesh</option>
                        <option value="Assam">Assam</option>
                        <option value="Bihar">Bihar</option>
                        <option value="Chhattisgarh">Chhattisgarh</option>
                        <option value="Goa">Goa</option>
                        <option value="Gujarat">Gujarat</option>
                        <option value="Haryana">Haryana</option>
                        <option value="Himachal Pradesh">Himachal Pradesh</option>
                        <option value="Jharkhand">Jharkhand</option>
                        <option value="Karnataka">Karnataka</option>
                        <option value="Kerala">Kerala</option>
                        <option value="Madhya Pradesh">Madhya Pradesh</option>
                        <option value="Maharashtra">Maharashtra</option>
                        <option value="Manipur">Manipur</option>
                        <option value="Meghalaya">Meghalaya</option>
                        <option value="Mizoram">Mizoram</option>
                        <option value="Nagaland">Nagaland</option>
                        <option value="Odisha">Odisha</option>
                        <option value="Punjab">Punjab</option>
                        <option value="Rajasthan">Rajasthan</option>
                        <option value="Sikkim">Sikkim</option>
                        <option value="Tamil Nadu">Tamil Nadu</option>
                        <option value="Telangana">Telangana</option>
                        <option value="Tripura">Tripura</option>
                        <option value="Uttar Pradesh">Uttar Pradesh</option>
                        <option value="Uttarakhand">Uttarakhand</option>
                        <option value="West Bengal">West Bengal</option>
                        <option value="Delhi">Delhi</option>
                        <option value="Andaman and Nicobar Islands">Andaman and Nicobar Islands</option>
                        <option value="Chandigarh">Chandigarh</option>
                        <option value="Dadra and Nagar Haveli and Daman and Diu">Dadra and Nagar Haveli and Daman and Diu</option>
                        <option value="Lakshadweep">Lakshadweep</option>
                        <option value="Puducherry">Puducherry</option>
                        <option value="Ladakh">Ladakh</option>
                        <option value="Jammu and Kashmir">Jammu and Kashmir</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/parties')}
              className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all font-medium text-sm sm:text-base"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto px-6 sm:px-8 py-2 sm:py-3 bg-[#000000] text-white rounded-lg transition-all shadow-sm hover:shadow-md font-medium flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <Save size={18} />
              Update Party
            </button>
          </div>
        </form>
      </div>

      {/* Manage Category Modal */}
      {showAddCategory && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Tag size={20} className="text-blue-600" />
                Manage Categories
              </h3>
              <button 
                onClick={() => {
                    setShowAddCategory(false);
                    setEditingCategoryId(null);
                    setNewCategoryName('');
                }}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                type="button"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
                {/* Add/Edit Form */}
                <form 
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (editingCategoryId) {
                            handleUpdateCategory(editingCategoryId, newCategoryName);
                        } else {
                            handleCreateCategory(e);
                        }
                    }} 
                    className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100"
                >
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                        {editingCategoryId ? 'Edit Category' : 'Create New Category'}
                    </label>
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            autoFocus
                            required
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all outline-none text-sm"
                            placeholder="Enter category name..."
                        />
                        <button 
                            type="submit"
                            disabled={categoryLoading}
                            className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${editingCategoryId ? 'bg-green-600 hover:bg-green-700' : 'bg-black hover:bg-gray-800'} text-white shadow-sm`}
                        >
                            {categoryLoading ? '...' : editingCategoryId ? <Check size={16} /> : <Plus size={16} />}
                        </button>
                        {editingCategoryId && (
                             <button 
                                type="button"
                                onClick={() => {
                                    setEditingCategoryId(null);
                                    setNewCategoryName('');
                                }}
                                className="p-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition-all"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                </form>

                {/* Categories List */}
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Existing Categories ({categories.length})</p>
                    {categories.length === 0 ? (
                        <div className="text-center py-8 text-gray-400 italic text-sm">No categories found</div>
                    ) : (
                        categories.map((cat) => (
                            <div key={cat._id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl hover:border-blue-100 hover:bg-blue-50/30 transition-all group">
                                <span className="text-sm font-medium text-gray-700">{cat.name}</span>
                                <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => {
                                            setEditingCategoryId(cat._id);
                                            setNewCategoryName(cat.name);
                                        }}
                                        className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                                        title="Edit"
                                        type="button"
                                    >
                                        <Edit size={14} />
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteCategory(cat._id)}
                                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                                        title="Delete"
                                        type="button"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                <button 
                    type="button"
                    onClick={() => {
                        setShowAddCategory(false);
                        setEditingCategoryId(null);
                        setNewCategoryName('');
                    }}
                    className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors"
                >
                    Close
                </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default EditParty;