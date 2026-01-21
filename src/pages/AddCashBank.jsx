import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { ArrowLeft, Building2, Wallet, CreditCard, Smartphone, Save } from 'lucide-react';
import api from '../lib/axios';
import Swal from 'sweetalert2';

const AddCashBank = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    type: 'Cash',
    openingBalance: 0,
    balanceType: 'debit',
    status: 'Active',
    bankName: '',
    accountNumber: '',
    ifsc: '',
    branch: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        await api.post('/accounts', formData);
        Swal.fire({
            icon: 'success',
            title: 'Account Created',
            text: 'Your new account has been successfully created.',
            timer: 1500,
            showConfirmButton: false
        });
        navigate('/cash-bank');
    } catch (error) {
        console.error("Failed to create account", error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to create account. Please try again.',
        });
    }
  };

  const accountTypes = [
    { value: 'Cash', label: 'Cash', icon: Wallet, description: 'Physical cash in hand' },
    { value: 'Bank', label: 'Bank Account', icon: Building2, description: 'Bank savings/current account' },
    { value: 'UPI', label: 'UPI Wallet', icon: Smartphone, description: 'Digital payment wallet' }
  ];

  const getTypeIcon = (type) => {
    const typeObj = accountTypes.find(t => t.value === type);
    const IconComponent = typeObj?.icon || CreditCard;
    return <IconComponent size={18} />;
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-4 mb-6 sm:mb-8">
        <button
          onClick={() => navigate('/cash-bank')}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all flex-shrink-0"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">Add New Account</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">Create a new cash or bank account</p>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden w-full">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900">Account Information</h3>
          <p className="text-sm text-gray-600 mt-1">Fill in the details below to add a new account</p>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6">
          <div className="space-y-6 sm:space-y-8">
            
            {/* Account Type Selection */}
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CreditCard size={18} className="text-blue-600 flex-shrink-0" />
                <span className="truncate">Account Type</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {accountTypes.map((type) => {
                  const IconComponent = type.icon;
                  return (
                    <div
                      key={type.value}
                      onClick={() => setFormData({...formData, type: type.value})}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.type === type.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          formData.type === type.value ? 'bg-blue-100' : 'bg-gray-100'
                        }`}>
                          <IconComponent size={20} className={
                            formData.type === type.value ? 'text-blue-600' : 'text-gray-600'
                          } />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{type.label}</div>
                          <div className="text-sm text-gray-500">{type.description}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Basic Information */}
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
                {getTypeIcon(formData.type)}
                <span className="truncate">Basic Information</span>
              </h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!/\d/.test(val)) {
                        setFormData({...formData, name: val});
                      }
                    }}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                    placeholder={`Enter ${formData.type.toLowerCase()} account name`}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base appearance-none bg-white"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Bank Details - Only show if Bank type is selected */}
            {formData.type === 'Bank' && (
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Building2 size={18} className="text-green-600 flex-shrink-0" />
                  <span className="truncate">Bank Details</span>
                </h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bank Name *
                    </label>
                    <input
                      type="text"
                      value={formData.bankName}
                      onChange={(e) => setFormData({...formData, bankName: e.target.value})}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                      placeholder="e.g., State Bank of India"
                      required={formData.type === 'Bank'}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Account Number *
                    </label>
                    <input
                      type="text"
                      value={formData.accountNumber}
                      onChange={(e) => setFormData({...formData, accountNumber: e.target.value})}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                      placeholder="Enter account number"
                      required={formData.type === 'Bank'}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      IFSC Code *
                    </label>
                    <input
                      type="text"
                      value={formData.ifsc}
                      onChange={(e) => setFormData({...formData, ifsc: e.target.value.toUpperCase()})}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                      placeholder="e.g., SBIN0001234"
                      required={formData.type === 'Bank'}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Branch Name
                    </label>
                    <input
                      type="text"
                      value={formData.branch}
                      onChange={(e) => setFormData({...formData, branch: e.target.value})}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                      placeholder="Enter branch name"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Financial Setup */}
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Wallet size={18} className="text-purple-600 flex-shrink-0" />
                <span className="truncate">Financial Setup</span>
              </h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Opening Balance
                  </label>
                  <input
                    type="number"
                    value={formData.openingBalance}
                    onChange={(e) => {
                        const val = e.target.value;
                        setFormData({...formData, openingBalance: val === '' ? '' : parseFloat(val)});
                    }}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Balance Type
                  </label>
                  <select
                    value={formData.balanceType}
                    onChange={(e) => setFormData({...formData, balanceType: e.target.value})}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base appearance-none bg-white"
                  >
                    <option value="debit">Debit (Cash Available)</option>
                    <option value="credit">Credit (Overdraft)</option>
                  </select>
                </div>
              </div>
              
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/cash-bank')}
              className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all font-medium text-sm sm:text-base"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto px-6 sm:px-8 py-2 sm:py-3 bg-[#000000] text-white rounded-lg transition-all shadow-sm hover:shadow-md font-medium flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <Save size={18} />
              Create Account
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default AddCashBank;