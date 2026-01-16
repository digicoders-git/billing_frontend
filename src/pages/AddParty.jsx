import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { 
    ArrowLeft, Settings, Save, HelpCircle, 
    Landmark, Plus, ChevronDown, X, Trash2, Edit
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
    customFieldCategory: '',
    customFieldValue: ''
  });

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
                     <div className="relative">
                        <select 
                            value={formData.category}
                            onChange={(e) => handleChange('category', e.target.value)}
                            className="w-full appearance-none px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none transition-all bg-white cursor-pointer text-gray-500"
                        >
                            <option value="">Select Category</option>
                            <option value="retail">Retail</option>
                            <option value="wholesale">Wholesale</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
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
    </DashboardLayout>
  );
};

export default AddParty;