import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { 
    ArrowLeft, Settings, Save, HelpCircle, 
    Landmark, Plus, ChevronDown, X, Trash2, Edit, Tag, Check
} from 'lucide-react';
import api from '../lib/axios';
import Swal from 'sweetalert2';

const AddParty = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo'); // Get return URL from query params
  
  const [showBankModal, setShowBankModal] = useState(false);
  const [bankAccountForm, setBankAccountForm] = useState({
    accountNo: '',
    confirmAccountNo: '',
    ifsc: '',
    bankName: '',
    holderName: '',
    upi: ''
  });

  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    openingBalance: 0,
    balanceType: 'To Collect',
    gstin: '',
    pan: '',
    type: 'Customer',
    category: '',
    billingAddress: '',
    shippingAddress: '',
    creditPeriod: 30,
    creditLimit: 0,
    contactPerson: '',
    dob: '',
    bankAccount: null, // Stores bankAccountForm object after submission
    placeOfSupply: '',
    customFieldCategory: '',
    customFieldValue: ''
  });

  const [categories, setCategories] = useState([]);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [categoryLoading, setCategoryLoading] = useState(false);

  // Fetch categories
  React.useEffect(() => {
    const fetchCategories = async () => {
        try {
            const response = await api.get('/party-categories');
            setCategories(response.data);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };
    fetchCategories();
  }, []);

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

  const [sameAsBilling, setSameAsBilling] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => {
      setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) {
        Swal.fire('Error', 'Party Name is required', 'error');
        return;
    }
    setLoading(true);
    try {
        const response = await api.post('/parties', formData);
        const createdParty = response.data;
        
        // Store newly created party in localStorage for other pages to use
        if (returnTo) {
            localStorage.setItem('newlyCreatedParty', JSON.stringify(createdParty));
        }
        
        Swal.fire('Success', 'Party created successfully', 'success');
        
        // Navigate back to the return URL or default to parties page
        if (returnTo) {
            navigate(returnTo);
        } else {
            navigate('/parties');
        }
    } catch (error) {
        console.error('Error creating party:', error);
        Swal.fire('Error', error.response?.data?.message || 'Failed to create party', 'error');
    } finally {
        setLoading(false);
    }
  };

  const handleSaveAndNew = async () => {
      if (!formData.name) {
          Swal.fire('Error', 'Party Name is required', 'error');
          return;
      }
      setLoading(true);
      try {
          await api.post('/parties', formData);
          Swal.fire({
              title: 'Success',
              text: 'Party created successfully',
              icon: 'success',
              toast: true,
              position: 'top-end',
              showConfirmButton: false,
              timer: 3000
          });
          
          setFormData({
            name: '', mobile: '', email: '', openingBalance: 0, balanceType: 'To Collect',
            gstin: '', pan: '', type: 'Customer', category: '', billingAddress: '',
            shippingAddress: '', creditPeriod: 30, creditLimit: 0,
            contactPerson: '', dob: '', bankAccount: null,
            placeOfSupply: '',
            customFieldCategory: '', customFieldValue: ''
          });
          setSameAsBilling(false);
      } catch (error) {
          console.error('Error creating party:', error);
          Swal.fire('Error', error.response?.data?.message || 'Failed to create party', 'error');
      } finally {
          setLoading(false);
      }
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
            <button
            onClick={() => navigate('/parties')}
            className="p-2 -ml-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
            >
            <ArrowLeft size={24} />
            </button>
            <h1 className="text-2xl font-semibold text-gray-900">Create Party</h1>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
           
            <button className="p-2 text-gray-500 hover:text-black border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors sm:hidden">
                 <span className="text-sm">Settings</span>
            </button>
            
            <button 
                type="button"
                onClick={handleSaveAndNew}
                className="flex-1 sm:flex-none px-4 py-2 border border-black text-black rounded-lg font-medium hover:bg-gray-50 transition-colors bg-white text-sm"
            >
                Save & New
            </button>
            <button 
                onClick={handleSubmit}
                className="flex-1 sm:flex-none px-6 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors shadow-sm text-sm"
            >
                Save
            </button>
        </div>
      </div>

      <div className="space-y-6 pb-20">
        
        {/* General Details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-800 mb-6">General Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Party Name<span className="text-red-500">*</span></label>
                    <input 
                        type="text" 
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all placeholder-gray-400"
                        placeholder="Enter name"
                    />
                </div>
                <div className="lg:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Mobile Number</label>
                    <input 
                        type="text" 
                        value={formData.mobile}
                        onChange={(e) => handleChange('mobile', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all placeholder-gray-400"
                        placeholder="Enter mobile number"
                    />
                </div>
                <div className="lg:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                    <input 
                        type="email" 
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all placeholder-gray-400"
                        placeholder="Enter email"
                    />
                </div>
                <div className="lg:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Opening Balance</label>
                    <div className="flex">
                         <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                            <input 
                                type="number" 
                                value={formData.openingBalance === 0 ? '' : formData.openingBalance}
                                onChange={(e) => handleChange('openingBalance', e.target.value)}
                                className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all placeholder-gray-400 border-r-0"
                                placeholder="0"
                            />
                         </div>
                         <select 
                            value={formData.balanceType}
                            onChange={(e) => handleChange('balanceType', e.target.value)}
                            className="bg-gray-50 border border-gray-300 rounded-r-lg px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-black cursor-pointer min-w-[100px]"
                         >
                             <option>To Collect</option>
                             <option>To Pay</option>
                         </select>
                    </div>
                </div>

                <div className="lg:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">GSTIN</label>
                    <input 
                        type="text" 
                        value={formData.gstin}
                        onChange={(e) => handleChange('gstin', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all placeholder-gray-400 uppercase"
                        placeholder="ex: 29XXXXX9438J"
                    />
                </div>
                <div className="lg:col-span-1 flex items-end">
                    <button className="w-full py-2 bg-gray-200 text-gray-900 font-medium rounded-lg hover:bg-gray-300 transition-colors text-sm cursor-pointer opacity-70 hover:opacity-100">
                        Get Details
                    </button>
                    {/* Note below standard input */}
                </div>
                 <div className="lg:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">PAN Number</label>
                    <input 
                        type="text" 
                        value={formData.pan}
                        onChange={(e) => handleChange('pan', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none transition-all placeholder-gray-400 uppercase"
                        placeholder="Enter party PAN No."
                    />
                </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Note: You can auto populate party details from GSTIN</p>
            
            <div className="border-t border-gray-100 my-6"></div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1.5">Party Type<span className="text-red-500">*</span></label>
                     <div className="relative">
                        <select 
                            value={formData.type}
                            onChange={(e) => handleChange('type', e.target.value)}
                            className="w-full appearance-none px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none transition-all bg-white cursor-pointer"
                        >
                            <option>Customer</option>
                            <option>Supplier</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                     </div>
                </div>
                <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1.5">Party Category</label>
                     <div className="flex gap-2">
                         <div className="relative flex-1">
                            <select 
                                value={formData.category}
                                onChange={(e) => handleChange('category', e.target.value)}
                                className="w-full appearance-none px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all bg-white cursor-pointer pr-10"
                            >
                                <option value="">Select Category</option>
                                {categories.map(cat => (
                                    <option key={cat._id} value={cat.name}>{cat.name}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                         </div>
                         <button 
                            type="button"
                            onClick={() => setShowAddCategory(true)}
                            className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-all flex items-center justify-center shrink-0"
                            title="Add New Category"
                        >
                            <Plus size={18} />
                        </button>
                     </div>
                </div>
            </div>
        </div>

        {/* Address */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-800 mb-6">Address</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Billing Address</label>
                    <textarea 
                        rows="4"
                        value={formData.billingAddress}
                        onChange={(e) => {
                            handleChange('billingAddress', e.target.value);
                            if(sameAsBilling) handleChange('shippingAddress', e.target.value);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none transition-all placeholder-gray-400 resize-none"
                        placeholder="Enter billing address"
                    />
                </div>
                <div>
                    <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-sm font-medium text-gray-700">Shipping Address</label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                                type="checkbox"
                                checked={sameAsBilling}
                                onChange={(e) => {
                                    setSameAsBilling(e.target.checked);
                                    if(e.target.checked) handleChange('shippingAddress', formData.billingAddress);
                                }}
                                className="rounded text-purple-600 focus:ring-gray-500 border-gray-300 cursor-pointer"
                            />
                            <span className="text-sm text-gray-600">Same as Billing address</span>
                        </label>
                    </div>
                    <textarea 
                        rows="4"
                        value={formData.shippingAddress}
                        onChange={(e) => handleChange('shippingAddress', e.target.value)}
                        readOnly={sameAsBilling}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none transition-all placeholder-gray-400 resize-none ${sameAsBilling ? 'bg-gray-50' : ''}`}
                        placeholder="Enter shipping address"
                    />
                </div>
            </div>

            <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Place of Supply (State)</label>
                <div className="relative">
                    <select 
                        value={formData.placeOfSupply}
                        onChange={(e) => handleChange('placeOfSupply', e.target.value)}
                        className="w-full appearance-none px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all bg-white cursor-pointer"
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
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                </div>
            </div>
        </div>

        {/* Credit & Limits */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                 {/* Tooltip Popup simulation - usually would use a proper tooltip component */}
                 <div className="hidden absolute top-[-50px] left-1/2 transform -translate-x-1/2 bg-[#1e293b] text-white text-xs px-3 py-2 rounded shadow-lg z-10 w-64 text-center">
                     Maximum amount of outstanding balance this party can hold on credit
                     <div className="absolute bottom-[-4px] left-1/2 transform -translate-x-1/2 w-2 h-2 bg-[#1e293b] rotate-45"></div>
                 </div>

                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Credit Period</label>
                    <div className="flex">
                        <input 
                            type="number"
                            value={formData.creditPeriod}
                            onChange={(e) => handleChange('creditPeriod', e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none transition-all border-r-0"
                        />
                        <span className="bg-gray-50 border border-gray-300 border-l-0 rounded-r-lg px-3 py-2 text-sm text-gray-600 flex items-center">Days</span>
                    </div>
                 </div>
                 <div>
                    <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                        Credit Limit 
                        {/* <HelpCircle size={14} className="text-gray-400 cursor-help" /> */}
                    </label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                        <input 
                            type="number"
                            value={formData.creditLimit === 0 ? '' : formData.creditLimit}
                            onChange={(e) => handleChange('creditLimit', e.target.value)}
                            className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none transition-all"
                            placeholder="0"
                        />
                    </div>
                 </div>
             </div>
        </div>

        {/* Contact Person Details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-800 mb-6">Contact Person Details</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Contact Person Name</label>
                    <input 
                        type="text"
                        value={formData.contactPerson}
                        onChange={(e) => handleChange('contactPerson', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none transition-all placeholder-gray-400"
                        placeholder="Ex: Ankit Mishra"
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Date of Birth</label>
                    <div className="relative">
                        <input 
                            type="date"
                            value={formData.dob}
                            onChange={(e) => handleChange('dob', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none transition-all text-gray-500 placeholder-gray-400 cursor-pointer"
                        />
                         {/* Icon overlay to make it look custom if needed, but native date picker is usually fine */}
                    </div>
                 </div>
             </div>
        </div>

        {/* Party Bank Account */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-800 mb-6">Party Bank Account</h3>
            
            {formData.bankAccount ? (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex justify-between items-center group relative animate-fade-in">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-blue-600">
                            <Landmark size={24} />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900">{formData.bankAccount.holderName}</h4>
                            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                                {formData.bankAccount.bankName} • {formData.bankAccount.accountNo}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            type="button"
                            onClick={() => setShowBankModal(true)}
                            className="p-2 hover:bg-white rounded-lg text-blue-600 transition-all opacity-0 group-hover:opacity-100"
                        >
                            <Edit size={16} />
                        </button>
                        <button 
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, bankAccount: null }))}
                            className="p-2 hover:bg-red-50 rounded-lg text-black transition-all"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm text-gray-400">
                        <Landmark size={32} />
                    </div>
                    <p className="text-gray-500 mb-4">Add party bank information to manage transactions</p>
                    <button 
                        type="button"
                        onClick={() => setShowBankModal(true)}
                        className="flex items-center gap-2 text-blue-500 font-medium hover:text-blue-600 transition-colors"
                    >
                        <Plus size={18} /> Add Bank Account
                    </button>
                </div>
            )}
        </div>

        {/* Bank Account Modal */}
        {showBankModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-scale-up">
                    {/* Modal Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                        <h3 className="text-xl font-bold text-gray-900">Add Bank Account</h3>
                        <button 
                            onClick={() => setShowBankModal(false)}
                            className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Modal Body */}
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        if (bankAccountForm.accountNo !== bankAccountForm.confirmAccountNo) {
                            alert("Account numbers do not match!");
                            return;
                        }
                        setFormData(prev => ({ ...prev, bankAccount: bankAccountForm }));
                        setShowBankModal(false);
                    }} className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Bank Account Number<span className="text-red-500">*</span></label>
                                <input 
                                    type="text" 
                                    required
                                    value={bankAccountForm.accountNo}
                                    onChange={(e) => setBankAccountForm(prev => ({ ...prev, accountNo: e.target.value }))}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-500 focus:bg-white transition-all outline-none"
                                    placeholder="ex: 123456789"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Re-Enter Bank Account Number<span className="text-red-500">*</span></label>
                                <input 
                                    type="text" 
                                    required
                                    value={bankAccountForm.confirmAccountNo}
                                    onChange={(e) => setBankAccountForm(prev => ({ ...prev, confirmAccountNo: e.target.value }))}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-500 focus:bg-white transition-all outline-none"
                                    placeholder="ex: 123456789"
                                />
                                {bankAccountForm.confirmAccountNo && bankAccountForm.accountNo !== bankAccountForm.confirmAccountNo && (
                                    <span className="text-xs text-red-500 mt-1 block">Account numbers do not match</span>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1.5 uppercase tracking-wider">IFSC Code</label>
                                <input 
                                    type="text" 
                                    value={bankAccountForm.ifsc}
                                    onChange={(e) => setBankAccountForm(prev => ({ ...prev, ifsc: e.target.value.toUpperCase() }))}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-500 focus:bg-white transition-all outline-none uppercase"
                                    placeholder="ex: ICIC0001234"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Bank & Branch Name</label>
                                <input 
                                    type="text" 
                                    value={bankAccountForm.bankName}
                                    onChange={(e) => setBankAccountForm(prev => ({ ...prev, bankName: e.target.value }))}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-500 focus:bg-white transition-all outline-none"
                                    placeholder="ex: ICICI Bank, Mumbai"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Account Holder's Name</label>
                                <input 
                                    type="text" 
                                    value={bankAccountForm.holderName}
                                    onChange={(e) => setBankAccountForm(prev => ({ ...prev, holderName: e.target.value }))}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-500 focus:bg-white transition-all outline-none"
                                    placeholder="ex: Babu Lal"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1.5 uppercase tracking-wider">UPI ID</label>
                                <input 
                                    type="text" 
                                    value={bankAccountForm.upi}
                                    onChange={(e) => setBankAccountForm(prev => ({ ...prev, upi: e.target.value }))}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-500 focus:bg-white transition-all outline-none"
                                    placeholder="ex: babulal@upi"
                                />
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
                            <button 
                                type="button"
                                onClick={() => setShowBankModal(false)}
                                className="px-8 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all text-sm"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit"
                                className="px-10 py-3 bg-[#EEF2FF] text-[#4F46E5] rounded-xl font-bold hover:bg-[#E0E7FF] transition-all text-sm shadow-sm"
                            >
                                Submit
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {/* Custom Field */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-6">Custom Field</h3>
            <div>
                 <label className="block text-sm font-medium text-blue-500 mb-1.5">category</label>
                 <input 
                     type="text" 
                     value={formData.customFieldValue}
                     onChange={(e) => handleChange('customFieldValue', e.target.value)}
                     className="w-full sm:w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none transition-all placeholder-gray-400"
                     placeholder="Custom Value"
                 />
            </div>
        </div>
      </div>
      
       {/* Help Bubble */}
      <div className="fixed bottom-6 right-6 z-20">
          <button className="w-10 h-10 bg-[#1e293b] text-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-800 transition-all cursor-pointer">
              <HelpCircle size={20} />
          </button>
      </div>

       {/* Manage Category Modal */}
       {showAddCategory && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
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
                            className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-black transition-all outline-none text-sm"
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

export default AddParty;